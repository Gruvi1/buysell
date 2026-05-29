package ru.prod.buysell.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.prod.buysell.dto.ProductRequest;
import ru.prod.buysell.dto.ProductResponse;
import ru.prod.buysell.dto.ProductUpdateRequest;
import ru.prod.buysell.entity.City;
import ru.prod.buysell.entity.Product;
import ru.prod.buysell.entity.ProductImage;
import ru.prod.buysell.entity.User;
import ru.prod.buysell.entity.UserDetailsImpl;
import ru.prod.buysell.entity.UserRole;
import ru.prod.buysell.exception.BusinessException;
import ru.prod.buysell.mapper.ProductMapper;
import ru.prod.buysell.repository.CityRepository;
import ru.prod.buysell.repository.ProductRepository;
import ru.prod.buysell.repository.UserRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CityRepository cityRepository;
    private final UserRepository userRepository;
    private final ProductImageService productImageService;
    private final ProductMapper productMapper;

    public Page<ProductResponse> getProducts(String title, Long cityId,
                                             BigDecimal minPrice, BigDecimal maxPrice,
                                             Pageable pageable) {

        String titleFilter = title == null ? "" : title.trim();
        Page<Product> products = productRepository.findAllWithFilters(titleFilter, cityId, minPrice, maxPrice, pageable);
        // TODO: неоптимальная работа с бд
        Map<Long, List<ProductImage>> imagesMap = products.getContent().stream()
                .collect(Collectors.toMap(
                        Product::getId,
                        product -> productImageService.getByProductId(product.getId()),
                        (existing, duplicate) -> existing
                ));
        Map<Long, String> cityNames = getCityNames(products.getContent());
        Map<Long, String> sellerNames = getSellerNames(products.getContent());


        log.info("Found {} products", products.getTotalElements());

        return products.map(product -> {
            ProductResponse response = productMapper.toResponse(product);

            productMapper.fillImagePaths(response, imagesMap.get(product.getId()));
            response.setCityName(cityNames.get(product.getCityId()));
            response.setSellerName(sellerNames.get(product.getSellerId()));
            response.setOwner(isCurrentUserOwner(product.getSellerId()));

            return response;
        });
    }

    @Transactional
    public ProductResponse saveProduct(ProductRequest request) {
        Long currentUserId = getCurrentUserId();

        Product product = productMapper.toEntity(request);
        product.setSellerId(currentUserId);
        product.setCityId(request.getCityId());
        product.setCreatedAt(Instant.now());
        product.setSold(false);

        Product savedProduct = productRepository.save(product);

        List<ProductImage> images = productImageService.saveAll(
                request.getImages(),
                savedProduct.getId(),
                request.getMainImageIndex()
        );

        ProductResponse response = productMapper.toResponse(savedProduct);
        productMapper.fillImagePaths(response, images);
        fillProductDetails(response, savedProduct);
        response.setOwner(true);

        return response;
    }

    @Transactional
    public void deleteProduct(Long id) {
        Long currentUserId = getCurrentUserId();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Товар не найден"));

        if (!product.getSellerId().equals(currentUserId) && !isAdmin()) {
            throw new BusinessException("Доступ запрещен");
        }

        productRepository.softDeleteById(id);
        log.info("Product {} soft-deleted by user {}", id, currentUserId);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Long currentUserId = getCurrentUserId();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Товар не найден"));

        if (!product.getSellerId().equals(currentUserId) && !isAdmin()) {
            throw new BusinessException("Доступ запрещен");
        }

        if (request.getTitle() != null) {
            product.setTitle(request.getTitle().trim());
        }

        if (request.getDescription() != null) {
            product.setDescription(request.getDescription().trim());
        }

        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }

        if (request.getCityId() != null) {
            product.setCityId(request.getCityId());
        }

        Product savedProduct = productRepository.save(product);
        List<ProductImage> images = hasUploadedImages(request)
                ? productImageService.replaceAll(
                        request.getImages(),
                        savedProduct.getId(),
                        request.getMainImageIndex()
                )
                : productImageService.getByProductId(savedProduct.getId());

        ProductResponse response = productMapper.toResponse(savedProduct);
        productMapper.fillImagePaths(response, images);
        fillProductDetails(response, savedProduct);
        response.setOwner(true);

        log.info("Product {} updated by user {}", id, currentUserId);
        return response;
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Товар не найден"));

        ProductResponse response = productMapper.toResponse(product);
        List<ProductImage> images = productImageService.getByProductId(product.getId());
        productMapper.fillImagePaths(response, images);
        fillProductDetails(response, product);

        response.setOwner(isCurrentUserOwner(product.getSellerId()));

        return response;
    }

    private Map<Long, String> getCityNames(List<Product> products) {
        List<Long> cityIds = products.stream()
                .map(Product::getCityId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        return cityRepository.findAllById(cityIds).stream()
                .collect(Collectors.toMap(City::getId, City::getName));
    }

    private Map<Long, String> getSellerNames(List<Product> products) {
        List<Long> sellerIds = products.stream()
                .map(Product::getSellerId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        return userRepository.findAllById(sellerIds).stream()
                .collect(Collectors.toMap(User::getId, this::getSellerName));
    }

    private void fillProductDetails(ProductResponse response, Product product) {
        response.setCityName(cityRepository.findById(product.getCityId()).map(City::getName).orElse(null));
        response.setSellerName(userRepository.findById(product.getSellerId()).map(this::getSellerName).orElse(null));
    }

    private String getSellerName(User user) {
        return user.getDisplayName() != null && !user.getDisplayName().isBlank()
                ? user.getDisplayName()
                : user.getEmail();
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetailsImpl user)) {
            throw new BusinessException("Пользователь не аутентифицирован");
        }
        return user.getId();
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(r -> Objects.equals(r.getAuthority(), UserRole.ADMIN.name()));
    }

    private boolean hasUploadedImages(ProductUpdateRequest request) {
        return request.getImages() != null && request.getImages().stream()
                .anyMatch(file -> file != null && !file.isEmpty());
    }

    private boolean isCurrentUserOwner(Long productSellerId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserDetailsImpl user) {
            return Objects.equals(user.getId(), productSellerId);
        }
        return false;
    }
}

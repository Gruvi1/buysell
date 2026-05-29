package ru.prod.buysell.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String sellerName;
    private String cityName;
    private Instant createdAt;
    private String title;
    private String description;
    private BigDecimal price;
    private boolean sold;
    private List<Long> imageIds;
    private boolean isOwner;
}
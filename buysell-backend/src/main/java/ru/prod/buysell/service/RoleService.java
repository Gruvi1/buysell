package ru.prod.buysell.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.prod.buysell.repository.RoleRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;

    public List<String> getRolesByUserId(Long userId) {
        return roleRepository.findRolesByUserId(userId);
    }
}

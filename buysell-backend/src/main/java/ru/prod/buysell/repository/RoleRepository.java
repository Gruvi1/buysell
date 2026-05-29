package ru.prod.buysell.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.prod.buysell.entity.UserRoleEntity;

import java.util.List;

public interface RoleRepository extends JpaRepository<UserRoleEntity, Long> {

    @Query("""
        select r.name
        from UserRoleEntity ur
        join ur.role r
        where ur.user.id = :userId
        """)
    List<String> findRolesByUserId(Long userId);
}

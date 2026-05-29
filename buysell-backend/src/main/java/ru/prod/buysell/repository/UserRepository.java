package ru.prod.buysell.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.prod.buysell.entity.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByEmail(String email);

    @Modifying
    @Query("update User u set u.email = 'deleted_' || u.id || '@deleted' where u.id = :id")
    void softDeleteById(@Param("id") Long id);

    // TODO: добавить поле isDeleted. Тогда будет:
//    @Modifying
//    @Query("update User u set u.isDeleted = true where u.id = :id")
//    void softDeleteById(@Param("id") Long id);
}

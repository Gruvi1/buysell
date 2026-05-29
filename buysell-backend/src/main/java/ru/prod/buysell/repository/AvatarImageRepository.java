package ru.prod.buysell.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import ru.prod.buysell.entity.AvatarImage;

public interface AvatarImageRepository extends JpaRepository<AvatarImage, Long> {
}

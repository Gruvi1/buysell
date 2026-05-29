package ru.prod.buysell.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.prod.buysell.entity.City;

public interface CityRepository extends JpaRepository<City, Long> {
}

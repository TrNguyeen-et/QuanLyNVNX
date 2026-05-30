package com.example.backend.repositories;

import com.example.backend.models.ShiftHandover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShiftHandoverRepository extends JpaRepository<ShiftHandover, Long> {
}

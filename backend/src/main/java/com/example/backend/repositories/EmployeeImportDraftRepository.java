package com.example.backend.repositories;

import com.example.backend.models.EmployeeImportDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface EmployeeImportDraftRepository extends JpaRepository<EmployeeImportDraft, Long> {
    List<EmployeeImportDraft> findByStatus(String status);
    boolean existsByUsername(String username);
    
    @Transactional
    void deleteByStatus(String status);
}
package com.example.backend.controllers;
import com.example.backend.models.*; import com.example.backend.repositories.*; import org.springframework.beans.factory.annotation.Autowired; import org.springframework.http.HttpStatus; import org.springframework.web.bind.annotation.*; import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime; import java.util.*;

@RestController @RequestMapping("/api/admin") @CrossOrigin(origins = "*") public class AdminController {
    @Autowired private UserRepository userRepository; @Autowired private AuditLogRepository auditLogRepository;

    private void log(String action, String actor) { AuditLog log = new AuditLog(); log.setAction(action); log.setActor(actor); log.setTimestamp(LocalDateTime.now()); auditLogRepository.save(log); }

    @GetMapping("/stats") public Map<String, Object> getStats() { Map<String, Object> s = new HashMap<>(); s.put("totalUsers", userRepository.findAll().size()); return s; }
    @GetMapping("/users") public List<User> getAll() { return userRepository.findAll(); }
    @GetMapping("/logs") public List<AuditLog> getLogs() { return auditLogRepository.findAllByOrderByIdDesc(); }

    @PostMapping("/create-account")
    public Map<String, Object> create(@RequestBody User u) { u.setStatus("ACTIVE"); User saved = userRepository.save(u); log("Tao tai khoan: " + u.getUsername(), "ADMIN");
        Map<String, Object> r = new HashMap<>(); r.put("status", "success"); r.put("message", "Tao thanh cong!"); r.put("userId", saved.getId()); return r; }

    @PutMapping("/users/{id}")
    public User update(@PathVariable long id, @RequestBody User u) { return userRepository.findById(id).map(user -> { user.setUsername(u.getUsername()); user.setFullName(u.getFullName()); user.setRole(u.getRole()); user.setStatus(u.getStatus()); log("Cap nhat tai khoan ID: " + id, "ADMIN"); return userRepository.save(user); }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found")); }

    @DeleteMapping("/users/{id}")
    public Map<String, String> delete(@PathVariable long id) { if(!userRepository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"); userRepository.deleteById(id); log("Xoa tai khoan ID: " + id, "ADMIN"); Map<String, String> r = new HashMap<>(); r.put("message", "Xoa thanh cong!"); return r; }
}
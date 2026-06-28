package com.example.backend.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "system_configs")
@SuppressWarnings("null")
public class SystemConfig {
    @Id
    private String configKey; // Ví dụ: PENALTY_15MIN, PENALTY_30MIN
    private String configValue; // Ví dụ: 20000, 50000
    private String description; // Mô tả: Phạt trễ dưới 15 phút

    public String getConfigKey() { return configKey; }
    public void setConfigKey(String configKey) { this.configKey = configKey; }

    public String getConfigValue() { return configValue; }
    public void setConfigValue(String configValue) { this.configValue = configValue; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
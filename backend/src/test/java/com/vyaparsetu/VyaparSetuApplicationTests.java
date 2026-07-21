package com.vyaparsetu;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class VyaparSetuApplicationTests {

    @Test
    @DisplayName("Application context loads successfully")
    void contextLoads() {
    }
}

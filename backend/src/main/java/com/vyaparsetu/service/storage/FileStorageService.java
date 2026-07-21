package com.vyaparsetu.service.storage;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    @Value("${app.file-storage.local-path:./uploads}")
    private String localStoragePath;

    @Value("${app.file-storage.base-url:http://localhost:8080/uploads}")
    private String baseUrl;

    private Path uploadDir;

    @PostConstruct
    public void init() {
        uploadDir = Paths.get(localStoragePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            log.error("Could not create upload directory: {}", e.getMessage());
        }
    }

    public String uploadFile(MultipartFile file, String path) {
        log.info("Uploading file to path: {}", path);

        try {
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path targetPath = uploadDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = baseUrl + "/" + fileName;
            log.info("File uploaded successfully: {}", fileUrl);
            return fileUrl;
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage());
            return saveLocally(file);
        }
    }

    public void deleteFile(String fileUrl) {
        log.info("Deleting file: {}", fileUrl);
        try {
            String fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            Path filePath = uploadDir.resolve(fileName);
            Files.deleteIfExists(filePath);
            log.info("File deleted: {}", fileUrl);
        } catch (IOException e) {
            log.error("Failed to delete file {}: {}", fileUrl, e.getMessage());
        }
    }

    public String generatePresignedUrl(String fileUrl, Duration expiry) {
        log.info("Generating presigned URL for: {} with expiry: {} seconds", fileUrl, expiry.getSeconds());
        return fileUrl + "?token=mock-token&expires=" + expiry.getSeconds();
    }

    public String saveLocally(MultipartFile file) {
        log.info("Saving file locally: {}", file.getOriginalFilename());
        try {
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path targetPath = uploadDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            String fileUrl = baseUrl + "/" + fileName;
            log.info("File saved locally: {}", fileUrl);
            return fileUrl;
        } catch (IOException e) {
            log.error("Failed to save file locally: {}", e.getMessage());
            return null;
        }
    }
}

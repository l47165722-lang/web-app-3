package com.webapp3.congestion.controller;

import com.webapp3.congestion.dto.LoginRequest;
import com.webapp3.congestion.entity.User;
import com.webapp3.congestion.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class UserController {

        @Autowired
        private UserRepository userRepository;

        @PostMapping("/login")
        public Map<String, Boolean> login(
                        @RequestBody LoginRequest request) {

                User user = userRepository.findByStudentIdAndPassword(
                                request.getStudentId(),
                                request.getPassword());

                return Map.of(
                                "success",
                                user != null);
        }

        @PostMapping("/signup")
        public Map<String, Boolean> signup(
                        @RequestBody LoginRequest request) {

                User existUser = userRepository.findByStudentId(
                                request.getStudentId());

                if (existUser != null) {
                        return Map.of(
                                        "success",
                                        false);
                }

                User user = new User();

                user.setStudentId(
                                request.getStudentId());

                user.setPassword(
                                request.getPassword());

                userRepository.save(user);

                return Map.of(
                                "success",
                                true);
        }

        @PostMapping("/deleteUser")
        public Map<String, Boolean> deleteUser(
                        @RequestBody LoginRequest request) {

                User user = userRepository.findByStudentId(
                                request.getStudentId());

                if (user == null) {
                        return Map.of(
                                        "success",
                                        false);
                }

                userRepository.delete(user);

                return Map.of(
                                "success",
                                true);
        }
}
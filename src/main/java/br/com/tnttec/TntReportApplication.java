package br.com.tnttec;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
@RestController
public class TntReportApplication extends SpringBootServletInitializer{

	public static void main(String[] args) {
		SpringApplication.run(TntReportApplication.class, args);
	}

	@GetMapping(value = "/hello")
	public String helloWorld(){
		return "Hello, World";
	}
}

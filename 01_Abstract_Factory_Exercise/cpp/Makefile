SDKROOT ?= $(shell xcrun --sdk macosx --show-sdk-path 2>/dev/null)
SYSROOT_FLAG = $(if $(SDKROOT),-isysroot $(SDKROOT),)

CXX ?= clang++
CXXFLAGS ?= -std=c++20 -Wall -Wextra -O2 $(SYSROOT_FLAG)
SRC = src/main.cpp
TARGET = bin/p_01_Abstract_Factory_Exercise

all: build

build:
	@mkdir -p bin
	$(CXX) $(CXXFLAGS) $(SRC) -o $(TARGET)

run: build
	@./$(TARGET)

clean:
	rm -rf bin build

.PHONY: all build run clean

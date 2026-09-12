CXX ?= clang++
CXXFLAGS ?= -std=c++20 -Wall -Wextra -O2
SRC = src/main.cpp
TARGET = bin/p_02_Builder

all: build

build:
	@mkdir -p bin
	$(CXX) $(CXXFLAGS) $(SRC) -o $(TARGET)

run: build
	@./$(TARGET)

clean:
	rm -rf bin build

.PHONY: all build run clean

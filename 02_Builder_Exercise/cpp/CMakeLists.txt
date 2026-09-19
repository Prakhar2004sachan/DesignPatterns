cmake_minimum_required(VERSION 3.15)
project(p_02_Builder_Exercise_cpp CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_executable(p_02_Builder_Exercise src/main.cpp)

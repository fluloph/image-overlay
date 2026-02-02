# IO Overlay Studio

A privacy-focused, browser-based tool for composing images with dynamic overlays, text, and backgrounds. Designed for simplicity and security, it runs entirely on your device without sending any data to a server.

## Overview

IO Overlay Studio allows you to stack multiple image layers (backgrounds and overlays) and text elements to create custom compositions. It is built as a static web application, meaning once loaded, it functions independently of any backend server.

## Core Rules & Philosophy

The development of this tool strictly adheres to the following tenets:

1.  **Privacy First**: All image processing happens locally in your browser's memory using the HTML5 Canvas API. No images are ever uploaded to a cloud server.
2.  **Zero Data Transfer**: The application does not send any user data or metadata to external servers. It is completely self-contained.
3.  **Aspect Ratio Preservation**: All images (backgrounds and overlays) are scaled while strictly maintaining their original aspect ratios to prevent distortion.
4.  **Static Architecture**: The project is built with pure HTML, CSS, and JavaScript, requiring no complex build steps or backend dependencies.

## Features

*   **Multi-Layer Compositing**: Add unlimited background and overlay image layers.
*   **Text Tools**: Add customizable text with controls for font size, color, background opacity, and positioning.
*   **Layer Management**: Reorder, delete, and toggle visibility of any layer.
*   **Precision Controls**: accurate sliders for Opacity, Scale, and X/Y Positioning.
*   **Project Saving**: Save your configuration (layer positions, text, settings) to a JSON file and restore it later.
*   **High-Quality Export**: Download your final creation as a high-quality JPEG.

## How to Use

1.  **Open the Tool**: Launch `index.html` in any modern web browser.
2.  **Add Backgrounds**:
    *   Click the **+** button in the "Background Layers" section.
    *   Upload an image.
    *   Use the controls to adjust position or move it up/down in the stack.
3.  **Add Text**:
    *   Click the **+** button in "Text Layers".
    *   Type your content and adjust styling (Color, Size, Background Opacity).
4.  **Add Overlays**:
    *   Click the **+** button in "Overlay Images".
    *   Upload transparent PNGs or other images to place on top.
5.  **Save/Load Project**:
    *   Use **Save Settings** to download a JSON file of your layout.
    *   Use **Open Settings** to restore a layout (you will need to re-select images for security reasons).
6.  **Export**:
    *   Click **Download Image** to save the final composition to your device.

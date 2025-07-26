#include <raylib.h>
#include <stdio.h>
#include <math.h>

#define FULLSCREEN 0
#define SQUARES 32
#define WIDTH 1280
#define HEIGHT 720
#define MAX_TEXTURES 1024

typedef struct Square {
  int position; // Texture index offset for shifting
  int fibonacci; // Fixed Fibonacci value for this square
  float size; // Current size (fibonacci * zoom)
  Texture2D texture; // Assigned texture
  float x; // Position X
  float y; // Position Y
} Square;

/* Draws all squares using their textures, scaled and positioned.
   Uses float values for smooth rendering without integer casting. */
void DrawSquares(const Square * squares) {
  for (int i = 0; i < SQUARES; i++) {
    Rectangle source = {
      .x = 0.0f,
      .y = 0.0f,
      .width = (float) squares[i].texture.width,
      .height = (float) squares[i].texture.height
    };
    Rectangle dest = {
      .x = squares[i].x,
      .y = squares[i].y,
      .width = squares[i].size,
      .height = squares[i].size
    };
    Vector2 origin = {
      0.0f,
      0.0f
    };
    DrawTexturePro(squares[i].texture, source, dest, origin, 0.0f, WHITE);
  }
}

/* Updates the size of each square based on current zoom level.
   Size = precomputed_fibonacci * zoom. */
void UpdateSizes(Square * squares, float zoom) {
  for (int i = 0; i < SQUARES; i++) {
    squares[i].size = squares[i].fibonacci * zoom;
  }
}

/* Positions squares in a spiral pattern starting from the largest square.
   The spiral is built by adjusting position based on current and next square,
   cycling through four directions (right, down, left, up). */
void PositionSpiral(Square * squares) {
  float x = 0, y = 0;
  int dir = 0;
  for (int i = 0; i < SQUARES - 1; i++) {
    squares[i].x = x;
    squares[i].y = y;
    switch (dir++ % 4) {
    case 0: x += squares[i].size; break;
    case 1: x += squares[i].size - squares[i + 1].size; y += squares[i].size; break;
    case 2: x -= squares[i + 1].size; y += squares[i].size - squares[i + 1].size; break;
    case 3: y -= squares[i + 1].size; break;
    }
  }
  squares[SQUARES - 1].x = x;
  squares[SQUARES - 1].y = y;
}

/* Centers the entire spiral on the screen by offsetting all positions.
   Uses the center of the last (smallest) square as reference. */
void CenterSpiral(Square * squares) {
  float screenWidth = (float) GetScreenWidth();
  float screenHeight = (float) GetScreenHeight();

  float targetX = screenWidth / 2.0f;
  float targetY = screenHeight / 2.0f;

  const Square * last = & squares[SQUARES - 1];
  float centerX = last -> x + last -> size / 2.0f;
  float centerY = last -> y + last -> size / 2.0f;

  float offsetX = targetX - centerX;
  float offsetY = targetY - centerY;

  for (int i = 0; i < SQUARES; i++) {
    squares[i].x += offsetX;
    squares[i].y += offsetY;
  }
}

/* Shifts texture assignments by incrementing positions and reassigning textures.
   This cycles through textures in a stepped manner (+4 each reset). */
void ShiftSquares(Square * squares,
  const Texture2D * textures, int num_textures) {
  for (int i = 0; i < SQUARES; i++) {
    squares[i].position += 4;
    squares[i].texture = textures[squares[i].position % num_textures];
  }
}

int main(void) {

  float zoom = 0.001f;
  const float zoom_start = zoom;
  const float zoom_max = 0.0067f;
  float zoom_speed = 1.02f;
  int frame_counter = 0;

  #if FULLSCREEN
    InitWindow(GetMonitorWidth(0), GetMonitorHeight(0), "Moot Spiral");
    ToggleFullscreen();
  #else
    InitWindow(WIDTH, HEIGHT, "Moot Spiral");
  #endif

  SetTargetFPS(60);

  // Load and shuffle textures from "moots" directory
  Texture2D textures[MAX_TEXTURES];
  int num_textures = 0;
  FilePathList files = LoadDirectoryFiles("moots");
  for (unsigned int i = 0; i < files.count && num_textures < MAX_TEXTURES; i++) {
    textures[num_textures++] = LoadTexture(files.paths[i]);
  }
  for (int i = num_textures - 1; i > 0; i--) {
    int k = GetRandomValue(0, i);
    Texture2D temp = textures[i];
    textures[i] = textures[k];
    textures[k] = temp;
  }

  // Precompute Fibonacci sequence (first SQUARES numbers)
  int fibonacci[SQUARES];
  fibonacci[0] = 1;
  fibonacci[1] = 1;
  for (int i = 2; i < SQUARES; i++) {
    fibonacci[i] = fibonacci[i - 1] + fibonacci[i - 2];
  }

  // Initialize squares with reversed Fibonacci (largest first)
  Square squares[SQUARES];
  for (int i = 0; i < SQUARES; i++) {
    squares[i].position = i;
    squares[i].fibonacci = fibonacci[SQUARES - i - 1];
    squares[i].size = squares[i].fibonacci * zoom;
    squares[i].texture = textures[i % num_textures];
    squares[i].x = 0.0f;
    squares[i].y = 0.0f;
  }

  // Zoom, position, center, draw; reset and shift when zoom exceeds max
  while (!WindowShouldClose()) {
    BeginDrawing();
    ClearBackground(RAYWHITE);

    if (zoom >= zoom_max) {
      zoom = zoom_start;
      ShiftSquares(squares, textures, num_textures);
    }

    // Adjust zoom speed every 3 frames based on key holds
    if (++frame_counter >= 3) {
      if (IsKeyDown(KEY_RIGHT)) zoom_speed += 0.0002f;
      if (IsKeyDown(KEY_LEFT)) zoom_speed -= 0.0002f;
      frame_counter = 0;
    }

    // Apply frame-rate independent zoom growth
    zoom *= powf(zoom_speed, GetFrameTime() * 60.0f);
    UpdateSizes(squares, zoom);
    PositionSpiral(squares);
    CenterSpiral(squares);
    DrawSquares(squares);

    EndDrawing();
  }

  // Cleanup resources
  for (int i = 0; i < num_textures; i++) {
    UnloadTexture(textures[i]);
  }
  UnloadDirectoryFiles(files);
  CloseWindow();

  return 0;
}
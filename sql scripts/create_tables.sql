-- יצירת בסיס נתונים אם לא קיים
CREATE DATABASE IF NOT EXISTS recipes_db;
USE recipes_db;

-- טבלת משתמשים
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(8) UNIQUE NOT NULL,
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL
  
);

-- טבלת מתכונים מועדפים
CREATE TABLE IF NOT EXISTS FavoriteRecipes (
  user_id INT NOT NULL,
  recipe_id VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- טבלת מתכונים שנצפו לאחרונה
CREATE TABLE IF NOT EXISTS LastViewedRecipes (
  user_id INT NOT NULL,
  recipe_id VARCHAR(50) NOT NULL,
  view_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- טבלת מתכונים משפחתיים
CREATE TABLE IF NOT EXISTS FamilyRecipes (
  recipe_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  image VARCHAR(255),
  author VARCHAR(100) NOT NULL,
  whenToMake VARCHAR(255) NOT NULL,
  ingredients TEXT NOT NULL, -- JSON שיכיל מערך של אובייקטים עם name, amount, unit
  instructions TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- טבלת מתכונים של המשתמש
CREATE TABLE IF NOT EXISTS UserRecipes (
  recipe_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  image VARCHAR(255) NOT NULL,
  readyInMinutes INT NOT NULL,
  servings INT NOT NULL,
  vegetarian BOOLEAN DEFAULT FALSE,
  vegan BOOLEAN DEFAULT FALSE,
  glutenFree BOOLEAN DEFAULT FALSE,
  ingredients TEXT NOT NULL, -- JSON שיכיל מערך של אובייקטים עם name, amount, unit
  instructions TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- טבלת תכנון ארוחה (בונוס)
CREATE TABLE IF NOT EXISTS MealPlan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_id VARCHAR(50) NOT NULL,
  order_num INT DEFAULT 1,
  progress FLOAT DEFAULT 0, -- אחוז השלמה 0-100
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- טבלה לשמירת ניתוח מתכון (בונוס)
CREATE TABLE IF NOT EXISTS RecipeAnalysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id VARCHAR(50) NOT NULL,
  servings INT NOT NULL,
  ingredients TEXT NOT NULL, -- JSON שיכיל מערך של אובייקטים עם name, amount, unit
  equipment TEXT NOT NULL, -- JSON שיכיל מערך של אובייקטים עם name
  steps TEXT NOT NULL, -- JSON שיכיל מערך של צעדים עם number, step, equipment, ingredients, completed
  UNIQUE KEY recipe_analysis (recipe_id)
);

-- טבלה לשמירת מצב השלמת צעדים במתכון (בונוס)
CREATE TABLE IF NOT EXISTS RecipeStepCompletion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_id VARCHAR(50) NOT NULL,
  step_number INT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY user_recipe_step (user_id, recipe_id, step_number)
);


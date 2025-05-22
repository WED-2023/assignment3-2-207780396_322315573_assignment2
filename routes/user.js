var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    try {
      const users = await DButils.execQuery(
        `SELECT user_id FROM users WHERE user_id = ${req.session.user_id}`
      );
      
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      } else {
        res.sendStatus(401);
      }
    } catch (error) {
      console.error("Auth middleware error:", error);
      next(error);
    }
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    
    console.log(`Attempting to add recipe ${recipe_id} to favorites for user ${user_id}`);
    
    // check if the recipe exist in the db or in the API
    let recipeExists = false;
    
    // for each type of recipe (fam/user/spoonacular) check if it exists
    if (typeof recipe_id === 'string' && recipe_id.startsWith('f')) {
      // for family recipe
      const numericId = parseInt(recipe_id.substring(1));
      try {
        const familyRecipe = await user_utils.getFamilyRecipes(user_id, numericId);
        recipeExists = !!familyRecipe; // המר לבוליאני
      } catch (error) {
        console.error(`Error checking if family recipe ${recipe_id} exists:`, error);
      }
    } 
    else if (typeof recipe_id === 'string' && recipe_id.startsWith('u')) {
      // for user recipe
      const numericId = parseInt(recipe_id.substring(1));
      try {
        const userRecipe = await user_utils.getUserRecipes(user_id, numericId);
        recipeExists = !!userRecipe; // המר לבוליאני
      } catch (error) {
        console.error(`Error checking if user recipe ${recipe_id} exists:`, error);
      }
    }
    else {
      // for spoonacular recipe
      try {
        await recipe_utils.getRecipeDetails(recipe_id);
        recipeExists = true;
      } catch (error) {
        console.error(`Error checking if Spoonacular recipe ${recipe_id} exists:`, error);
        recipeExists = false;
      }
    }
    
    // if the recipe does not exist, return 404
    if (!recipeExists) {
      return res.status(404).send({ 
        message: `Recipe with ID ${recipe_id} does not exist`, 
        success: false 
      });
    }
    
    // check if the recipe is already in favorites
    const existingFavorites = await DButils.execQuery(
      `SELECT * FROM FavoriteRecipes WHERE user_id = '${user_id}' AND recipe_id = '${recipe_id}'`
    );
    // the recipe is already in favorites
    if (existingFavorites.length > 0) {
      return res.status(409).send({ 
        message: `Recipe ${recipe_id} is already in favorites`, 
        success: false 
      });
    }
    
    // add the recipe to favorites
    await user_utils.markAsFavorite(user_id, recipe_id);
    
    res.status(200).send({ 
      message: "The Recipe successfully saved as favorite",
      success: true
    });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    next(error);
  }
});


/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    console.log("Getting favorites for user:", user_id);
    
    // getting the user favorites from the DB
    const favorites = await user_utils.getFavoriteRecipes(user_id);
    console.log("Found favorites:", favorites);
    
    if (favorites.length === 0) {
      return res.status(200).send([]);
    }
    
    // sorting the favorites into different categories
    const spoonacularIds = [];
    const userRecipeIds = [];
    const familyRecipeIds = [];
    
    favorites.forEach(item => {
      const recipeId = item.recipe_id;
      if (recipeId.startsWith('f')) {
        familyRecipeIds.push(recipeId);
      } else if (recipeId.startsWith('u')) {
        userRecipeIds.push(recipeId);
      } else {
        spoonacularIds.push(recipeId);
      }
    });
    
    console.log("Spoonacular IDs:", spoonacularIds);
    console.log("User recipe IDs:", userRecipeIds);
    console.log("Family recipe IDs:", familyRecipeIds);
    
    const allFavorites = [];
    
    // connect to Spoonacular API and get the recipes
    if (spoonacularIds.length > 0) {
      console.log("Getting Spoonacular recipes");
      try {
        const spoonacularRecipes = await recipe_utils.getRecipesPreview(spoonacularIds);
        
        // check if the recipes were viewed
        const viewedIds = await user_utils.getViewedRecipeIds(user_id);
        
        // for each recipe, add the favorite and viewed properties
        for (const recipe of spoonacularRecipes) {
          recipe.favorite = true;
          recipe.viewed = viewedIds.includes(recipe.id.toString());
          allFavorites.push(recipe);
        }
        
        console.log(`Added ${spoonacularRecipes.length} Spoonacular recipes`);
      } catch (error) {
        console.error("Error getting Spoonacular recipes:", error);
      }
    }
    
    // getting user recipes (recipes that were created by the user)
    if (userRecipeIds.length > 0) {
      console.log("Getting user recipes");
      for (const recipeId of userRecipeIds) {
        try {
          // get the recipe id
          const numericId = parseInt(recipeId.substring(1));
          const userRecipe = await user_utils.getUserRecipes(user_id, numericId);
          
          if (userRecipe) {
            // add the favorite and viewed properties
            userRecipe.favorite = true;
            userRecipe.viewed = await user_utils.isRecipeViewed(user_id, recipeId);
            allFavorites.push(userRecipe);
            console.log(`Added user recipe ${recipeId}`);
          }
        } catch (error) {
          console.error(`Error getting user recipe ${recipeId}:`, error);
        }
      }
    }
    
    // getting family recipes (recipes that were created by the user's family)
    if (familyRecipeIds.length > 0) {
      console.log("Getting family recipes");
      for (const recipeId of familyRecipeIds) {
        try {
          // get the recipe id
          const numericId = parseInt(recipeId.substring(1));
          const familyRecipe = await user_utils.getFamilyRecipes(user_id, numericId);
          
          if (familyRecipe) {
            // add the favorite and viewed properties
            familyRecipe.favorite = true;
            familyRecipe.viewed = await user_utils.isRecipeViewed(user_id, recipeId);
            allFavorites.push(familyRecipe);
            console.log(`Added family recipe ${recipeId}`);
          }
        } catch (error) {
          console.error(`Error getting family recipe ${recipeId}:`, error);
        }
      }
    }
    
    console.log(`Returning ${allFavorites.length} favorite recipes`);
    res.status(200).send(allFavorites);
  } catch (error) {
    console.error("Error in GET /favorites:", error);
    next(error);
  }
});

/**
 * This path gets all recipes created by the logged-in user
 */
router.get('/myRecipes', async (req, res, next) => {
  try {
    // getting the user id from the session
    const user_id = req.session.user_id;
    
    // check if the user is authenticated
    if (!user_id) {
      return res.status(401).send({ message: "User not authenticated", success: false });
    }
    
    // getting the user recipes from the DB
    let userRecipes = [];
    try {
      userRecipes = await user_utils.getUserRecipes(user_id);
    } catch (dbError) {
      console.error("Database error:", dbError);
      // if the recipes table does not exist, return an error
      return res.status(500).send({ 
        message: "Error retrieving recipes. The recipes table might not exist.", 
        success: false 
      });
    }
    
    // if no recipes were found, return an empty array
    if (!userRecipes || userRecipes.length === 0) {
      return res.status(200).send([]);
    }
    
    // formatting the recipes
    // for each recipe, add the favorite and viewed properties
    const results = userRecipes.map(recipe => {
      return {
        id: recipe.id,
        title: recipe.title,
        readyInMinutes: recipe.readyInMinutes || 0,
        image: recipe.image || "",
        popularity: 0,
        vegan: recipe.vegan || false,
        vegetarian: recipe.vegetarian || false,
        glutenFree: recipe.glutenFree || false,
      };
    });
    
    // check if the user has viewed or favorited any recipes
    const viewedIds = await user_utils.getViewedRecipeIds(user_id);
    const favoriteIds = await user_utils.getFavoriteRecipeIds(user_id);
    
    results.forEach(recipe => {
      recipe.viewed = viewedIds.includes(recipe.id.toString());
      recipe.favorite = favoriteIds.includes(recipe.id.toString());
    });
    
    // returning the results
    res.status(200).send(results);
  } catch (error) {
    console.error("Error in GET /myRecipes:", error);
    next(error);
  }
});

/**
 * This path adds a new recipe created by the logged-in user
 */
router.post('/myRecipes', async (req, res, next) => {
  try {
    // getting the user id from the session
    const user_id = req.session.user_id;
    console.log("User ID from session:", user_id);
    
    // check if the user is authenticated
    if (!user_id) {
      throw { status: 401, message: "User ID not found in session" };
    }
    
    // verifying the request body- checking if all required fields are present
    const requiredFields = ['title', 'image', 'readyInMinutes', 'servings', 'ingredients', 'instructions'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        throw { status: 400, message: `${field} is required` };
      }
    }
    
    // checking if ingredients is an array
    if (!Array.isArray(req.body.ingredients)) {
      throw { status: 400, message: "ingredients must be an array" };
    }
    
    // checking if each ingredient has a name and amount
    for (const ingredient of req.body.ingredients) {
      if (!ingredient.name || ingredient.amount === undefined) {
        throw { status: 400, message: "each ingredient must have name and amount" };
      }
    }
    
    // creating the recipe
    console.log("Creating recipe for user:", user_id);
    const recipe_id = await user_utils.addUserRecipe(user_id, req.body);
    
    console.log("Recipe created successfully, ID:", recipe_id);
    res.status(201).send({ 
      message: "Recipe created successfully", 
      recipeId: recipe_id.toString() 
    });
  } catch (error) {
    console.error("Error creating recipe:", error);
    next(error);
  }
});

/**
 * This path gets all family recipes of the logged-in user
 */
router.get('/familyRecipes', async (req, res, next) => {
  try {
    console.log("GET /familyRecipes called");
    
    // getting the user id from the session
    const user_id = req.session.user_id;
    console.log("User ID from session:", user_id);
    
    // check if the user is authenticated
    if (!user_id) {
      throw { status: 401, message: "User not authenticated" };
    }
    
    // getting the family recipes from the DB
    const familyRecipes = await user_utils.getFamilyRecipes(user_id);
    console.log(`Retrieved ${familyRecipes.length} family recipes`);
    
    // add the favorite and viewed properties to each recipe
    const viewedIds = await user_utils.getViewedRecipeIds(user_id);
    const favoriteIds = await user_utils.getFavoriteRecipeIds(user_id);
    
    familyRecipes.forEach(recipe => {
      recipe.viewed = viewedIds.includes(recipe.id.toString());
      recipe.favorite = favoriteIds.includes(recipe.id.toString());
    });
    
    // returning the family recipes
    res.status(200).send(familyRecipes);
  } catch (error) {
    console.error("Error in GET /familyRecipes:", error);
    next(error);
  }
});

/**
 * This path adds a new family recipe for the logged-in user
 */
router.post('/familyRecipes', async (req, res, next) => {
  try {
    console.log("POST /familyRecipes called");
    
    // getting the user id from the session
    const user_id = req.session.user_id;
    console.log("User ID from session:", user_id);
    
    // check if the user is authenticated
    if (!user_id) {
      throw { status: 401, message: "User not authenticated" };
    }
    
    // verifying the request body- checking if all required fields are present
    const requiredFields = ['title', 'author', 'whenToMake', 'ingredients', 'instructions'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        throw { status: 400, message: `${field} is required` };
      }
    }
    
    // checking if ingredients is an array
    if (!Array.isArray(req.body.ingredients)) {
      throw { status: 400, message: "ingredients must be an array" };
    }
    
    // checking if each ingredient has a name and amount
    for (const ingredient of req.body.ingredients) {
      if (!ingredient.name || ingredient.amount === undefined) {
        throw { status: 400, message: "each ingredient must have name and amount" };
      }
    }
    
    // creating the family recipe
    const recipe_id = await user_utils.addFamilyRecipe(user_id, req.body);
    
    // checking if the recipe was created successfully
    res.status(201).send({ 
      message: "Family recipe created successfully", 
      recipeId: recipe_id.toString() 
    });
  } catch (error) {
    console.error("Error in POST /familyRecipes:", error);
    next(error);
  }
});


/**
 * This path returns the last viewed recipes of the logged-in user
 */
router.get('/last-viewed', async (req, res, next) => {
  try {
    console.log("GET /users/last-viewed called");
    // getting the user id from the session
    const user_id = req.session.user_id;
    console.log("User ID from session:", user_id);
    
    // check if the user is authenticated
    if (!user_id) {
      return res.status(401).send({ message: "User not authenticated", success: false });
    }
    
    // getting the last viewed recipes from the DB
    const viewedRecipes = await user_utils.getLastViewedRecipes(user_id);
    console.log(`Retrieved ${viewedRecipes.length} last viewed recipes`);
    
    // add the favorite property to each recipe
    const favoriteIds = await user_utils.getFavoriteRecipeIds(user_id);
    
    viewedRecipes.forEach(recipe => {
      recipe.favorite = favoriteIds.includes(recipe.id.toString());
    });

    // returning the last viewed recipes
    res.status(200).send(viewedRecipes);
  } catch (error) {
    console.error("Error in GET /users/last-viewed:", error);
    next(error);
  }
});

module.exports = router;
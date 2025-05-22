var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const user_utils = require("./utils/user_utils");  // הוספת ייבוא חסר

/**
 * This path returns random recipes for the homepage
 */
router.get('/', async (req, res, next) => {
  try {
    console.log("GET /recipes called - returning random recipes");
    
    // the number of random recipes to return, default is 3
    const number = req.query.number ? parseInt(req.query.number) : 3;
    
    // limit the number of recipes to between 1 and 10
    const validNumber = Math.min(Math.max(number, 1), 10);
    
    // get the random recipes 
    const randomRecipes = await recipes_utils.getRandomRecipes(validNumber);
    
    // if the user is logged in, get their viewed and favorite recipes
    if (req.session && req.session.user_id) {
      const viewedIds = await user_utils.getViewedRecipeIds(req.session.user_id);
      const favoriteIds = await user_utils.getFavoriteRecipeIds(req.session.user_id);
      
      randomRecipes.forEach(recipe => {
        recipe.viewed = viewedIds.includes(recipe.id.toString());
        recipe.favorite = favoriteIds.includes(recipe.id.toString());
      });
    } else {
      randomRecipes.forEach(recipe => {
        recipe.viewed = false;
        recipe.favorite = false;
      });
    }
    
    console.log(`Returning ${randomRecipes.length} random recipes`);
    res.status(200).send(randomRecipes);
  } catch (error) {
    console.error("Error in GET /recipes:", error);
    next(error);
  }
});

/**
 * This path allows searching for recipes with various filters and pagination
 */
router.get('/search', async (req, res, next) => {
  try {
    console.log("GET /recipes/search called with query:", req.query);
    
    // set up search parameters
    const searchParams = {};
    
    // text query
    if (req.query.query) {
      searchParams.query = req.query.query;
    }
    
    // number of results per page, default is 5
    searchParams.number = 5;
    if (req.query.number) {
      const number = parseInt(req.query.number);
      if (!isNaN(number) && number > 0) {
        searchParams.number = number;
      }
    }
    
    // page number, default is 1
    let page = 1;
    if (req.query.page) {
      const requestedPage = parseInt(req.query.page);
      if (!isNaN(requestedPage) && requestedPage > 0) {
        page = requestedPage;
      }
    }
    
    // calculate the offset for pagination
    searchParams.offset = (page - 1) * searchParams.number;
    
    // cuisine type
    if (req.query.cuisine) {
      searchParams.cuisine = req.query.cuisine;
    }
    
    // dish type
    if (req.query.diet) {
      searchParams.diet = req.query.diet;
    }
    
    // intolerance
    if (req.query.intolerance) {
      searchParams.intolerance = req.query.intolerance;
    }
    
    // search for recipes
    const searchResult = await recipes_utils.searchRecipes(searchParams);
    
    // add viewed and favorite status to each recipe
    if (req.session && req.session.user_id) {
      const viewedIds = await user_utils.getViewedRecipeIds(req.session.user_id);
      const favoriteIds = await user_utils.getFavoriteRecipeIds(req.session.user_id);
      
      searchResult.results.forEach(recipe => {
        recipe.viewed = viewedIds.includes(recipe.id.toString());
        recipe.favorite = favoriteIds.includes(recipe.id.toString());
      });
    } else {
      searchResult.results.forEach(recipe => {
        recipe.viewed = false;
        recipe.favorite = false;
      });
    }
    
    // prepare the response
    const response = {
      results: searchResult.results,
      pagination: {
        currentPage: searchResult.currentPage,
        totalPages: searchResult.totalPages,
        resultsPerPage: searchResult.resultsPerPage,
        totalResults: searchResult.totalResults
      }
    };
    
    // return the response
    console.log(`Returning search results: page ${response.pagination.currentPage} of ${response.pagination.totalPages}, with ${response.results.length} recipes`);
    res.status(200).send(response);
  } catch (error) {
    console.error("Error in GET /recipes/search:", error);
    
    // set the status code and message based on the error
    if (error.status && error.message) {
      res.status(error.status).send({ 
        message: error.message, 
        error: error.error,
        success: false 
      });
    } else {
      res.status(500).send({ 
        message: "Failed to search recipes", 
        error: error.message,
        success: false 
      });
    }
  }
});


/**
 * This path returns a full details of a recipe by its id
 */
router.get('/:recipeId', async (req, res, next) => {
  try {
    const recipe_id = req.params.recipeId;
    console.log(`GET /recipes/${recipe_id} called`);
    
    // check if the recipe_id is valid
    const user_id = req.session.user_id;
    
    // parse the recipe_id to determine its type (user, family, or Spoonacular)
    const parsedId = recipes_utils.parseRecipeId(recipe_id);
    
    let recipe;
    
    if (parsedId.type === 'user') {
      // user recipe
      recipe = await user_utils.getUserRecipes(user_id, parsedId.id);
    } else if (parsedId.type === 'family') {
      // family recipe
      recipe = await user_utils.getFamilyRecipes(user_id, parsedId.id);
    } else {
      // spoonacular recipe
      recipe = await recipes_utils.getRecipeDetails(parsedId.id);
    }
    
    // if the user is logged in, check if the recipe is viewed and favorite
    if (req.session && req.session.user_id) {
      // mark the recipe as viewed
      await user_utils.markRecipeAsViewed(req.session.user_id, recipe_id);
      
      // check if the recipe is favorite
      const favoriteIds = await user_utils.getFavoriteRecipeIds(req.session.user_id);
      recipe.favorite = favoriteIds.includes(recipe_id.toString());
      recipe.viewed = true;
    } else {
      recipe.favorite = false;
      recipe.viewed = false;
    }
    
    // return the recipe details
    res.send(recipe);
  } catch (error) {
    console.error(`Error in GET /recipes/${req.params.recipeId}:`, error);
    next(error);
  }
});

module.exports = router;
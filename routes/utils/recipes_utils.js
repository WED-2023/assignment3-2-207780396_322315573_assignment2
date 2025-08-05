// const axios = require("axios");
// const api_domain = "https://api.spoonacular.com/recipes";

// /**
//  * Parse recipe ID to determine its type and numeric ID
//  */
// function parseRecipeId(recipeId) {
//     // check if the recipeId is of user recipe type
//     if (typeof recipeId === 'string' && recipeId.startsWith('u')) {
//         return {
//             type: 'user',
//             id: parseInt(recipeId.substring(1))
//         };
//     }
    
//     // check if the recipeId is of family recipe type
//     if (typeof recipeId === 'string' && recipeId.startsWith('f')) {
//         return {
//             type: 'family',
//             id: parseInt(recipeId.substring(1))
//         };
//     }
    
//     // else, assume it's a spoonacular recipe
//     return {
//         type: 'spoonacular',
//         id: recipeId
//     };
// }

// /**
//  * Get recipe information from Spoonacular API
//  */
// async function getRecipeInformation(recipe_id) {
//     return await axios.get(`${api_domain}/${recipe_id}/information`, {
//         params: {
//             includeNutrition: false,
//             apiKey: process.env.spooncular_apiKey
//         }
//     });
// }

// /**
//  * Get detailed recipe information
//  */
// async function getRecipeDetails(recipe_id) {
//     let recipe_info = await getRecipeInformation(recipe_id);
//     let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

//     return {
//         id: id,
//         title: title,
//         readyInMinutes: readyInMinutes,
//         image: image,
//         popularity: aggregateLikes,
//         vegan: vegan,
//         vegetarian: vegetarian,
//         glutenFree: glutenFree,
//     }
// }

// /**
//  * Get bulk recipe information from Spoonacular API
//  */
// async function getRecipesPreview(recipe_ids) {
//     // if recipe_ids is not an array or is empty, return an empty array
//     if (!recipe_ids || recipe_ids.length === 0) {
//         return [];
//     }
    
//     try {
//         // define the API endpoint
//         const ids = recipe_ids.join(',');
        
//         // get recipe information from the API
//         const response = await axios.get(`${api_domain}/informationBulk`, {
//             params: {
//                 ids: ids,
//                 includeNutrition: false,
//                 apiKey: process.env.spooncular_apiKey
//             }
//         });
        
//         return response.data.map(recipe => {
//             return {
//                 id: recipe.id,
//                 title: recipe.title,
//                 readyInMinutes: recipe.readyInMinutes,
//                 image: recipe.image,
//                 popularity: recipe.aggregateLikes,
//                 vegan: recipe.vegan,
//                 vegetarian: recipe.vegetarian,
//                 glutenFree: recipe.glutenFree,
//             };
//         });
//     } catch (error) {
//         console.error("Error fetching recipes preview:", error);
//         throw error;
//     }
// }
// /**
//  * Get random recipes from Spoonacular API
//  */
// async function getRandomRecipes(number = 3) {
//     try {
//         console.log(`Getting ${number} random recipes`);
        
//         // get random recipes from the API
//         const response = await axios.get(`${api_domain}/random`, {
//             params: {
//                 number: number,
//                 apiKey: process.env.spooncular_apiKey
//             }
//         });
        
//         if (!response.data || !response.data.recipes || !Array.isArray(response.data.recipes)) {
//             console.error("Invalid response format from Spoonacular API");
//             return [];
//         }
        
//         console.log(`Retrieved ${response.data.recipes.length} random recipes`);
        
//         return response.data.recipes.map(recipe => {
//             return {
//                 id: recipe.id,
//                 title: recipe.title,
//                 readyInMinutes: recipe.readyInMinutes,
//                 image: recipe.image,
//                 popularity: recipe.aggregateLikes || 0,
//                 vegan: recipe.vegan,
//                 vegetarian: recipe.vegetarian,
//                 glutenFree: recipe.glutenFree,
//             };
//         });
//     } catch (error) {
//         console.error("Error fetching random recipes:", error);
//         throw error;
//     }
// }

// /**
//  * Search for recipes using Spoonacular API
//  */
// async function searchRecipes(params = {}) {
//     try {
//         console.log("Searching recipes with params:", params);
        
//         const searchParams = {
//             apiKey: process.env.spooncular_apiKey,
//             number: params.number || 5,
//             offset: params.offset || 0,
//             addRecipeInformation: true, 
//             fillIngredients: false,
//         };
        
//         // add optional parameters to searchParams
//         if (params.query) {
//             searchParams.query = params.query;
//         }
        
//         if (params.cuisine) {
//             searchParams.cuisine = params.cuisine;
//         }
        
//         if (params.diet) {
//             searchParams.diet = params.diet;
//         }
        
//         if (params.intolerance) {
//             searchParams.intolerances = params.intolerance;
//         }
        
        
//         console.log("Sending search request to Spoonacular API");
        
  
//         const response = await axios.get(`${api_domain}/complexSearch`, {
//             params: searchParams
//         });
        
//         console.log("Search API response status:", response.status);
        
//         // check if the response is valid
//         if (!response.data || !response.data.results || !Array.isArray(response.data.results)) {
//             console.error("Invalid response format from Spoonacular API:", response.data);
//             return {
//                 results: [],
//                 totalResults: 0,
//                 currentPage: 1,
//                 totalPages: 1
//             };
//         }
        
//         console.log(`Retrieved ${response.data.results.length} search results out of ${response.data.totalResults}`);
        
//         const formattedResults = response.data.results.map(recipe => {
//             return {
//                 id: recipe.id,
//                 title: recipe.title,
//                 readyInMinutes: recipe.readyInMinutes || 0,
//                 image: recipe.image || "",
//                 popularity: recipe.aggregateLikes || 0,
//                 vegan: recipe.vegan || false,
//                 vegetarian: recipe.vegetarian || false,
//                 glutenFree: recipe.glutenFree || false,
//             };
//         });
        
//         // calculate pagination details
//         const totalResults = response.data.totalResults || 0;
//         const resultsPerPage = parseInt(params.number) || 5;
//         const currentOffset = parseInt(params.offset) || 0;
//         const currentPage = Math.floor(currentOffset / resultsPerPage) + 1;
//         const totalPages = Math.ceil(totalResults / resultsPerPage);
        
//         return {
//             results: formattedResults,
//             totalResults: totalResults,
//             currentPage: currentPage,
//             totalPages: totalPages,
//             resultsPerPage: resultsPerPage
//         };
//     } catch (error) {
//         console.error("Error searching recipes:", error);
        
    
//         if (error.response) {
//             console.error("API Error status:", error.response.status);
//             console.error("API Error data:", error.response.data);
//             console.error("API Error URL:", error.config.url);
//             console.error("API Error params:", error.config.params);
//         }
        
//         throw { status: 500, message: "Error searching recipes", error: error.message };
//     }
// }

// // get types of cuisines
// async function getCuisines() {
//     return [
//         "African", "Asian", "American", "British", "Cajun", "Caribbean", 
//         "Chinese", "Eastern European", "European", "French", "German", 
//         "Greek", "Indian", "Irish", "Italian", "Japanese", "Jewish", 
//         "Korean", "Latin American", "Mediterranean", "Mexican", "Middle Eastern", 
//         "Nordic", "Southern", "Spanish", "Thai", "Vietnamese"
//     ];
// }

// // get types of diets
// async function getDiets() {
//     return [
//         "Gluten Free", "Ketogenic", "Vegetarian", "Lacto-Vegetarian", 
//         "Ovo-Vegetarian", "Vegan", "Pescetarian", "Paleo", "Primal", 
//         "Low FODMAP", "Whole30"
//     ];
// }

// // get types of intolerances
// async function getIntolerances() {
//     return [
//         "Dairy", "Egg", "Gluten", "Grain", "Peanut", "Seafood", 
//         "Sesame", "Shellfish", "Soy", "Sulfite", "Tree Nut", "Wheat"
//     ];
// }

// exports.parseRecipeId = parseRecipeId;
// exports.getRecipeDetails = getRecipeDetails;
// exports.getRecipesPreview = getRecipesPreview;
// exports.getRandomRecipes = getRandomRecipes;
// exports.searchRecipes = searchRecipes;
// exports.getCuisines = getCuisines;
// exports.getDiets = getDiets;
// exports.getIntolerances = getIntolerances;




const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";

/**
 * Parse recipe ID to determine its type and numeric ID
 */
function parseRecipeId(recipeId) {
    // check if the recipeId is of user recipe type
    if (typeof recipeId === 'string' && recipeId.startsWith('u')) {
        return {
            type: 'user',
            id: parseInt(recipeId.substring(1))
        };
    }
    
    // check if the recipeId is of family recipe type
    if (typeof recipeId === 'string' && recipeId.startsWith('f')) {
        return {
            type: 'family',
            id: parseInt(recipeId.substring(1))
        };
    }
    
    // else, assume it's a spoonacular recipe
    return {
        type: 'spoonacular',
        id: recipeId
    };
}

/**
 * Get recipe information from Spoonacular API
 */
async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

/**
 * Get detailed recipe information with ingredients and instructions
 */
async function getRecipeDetails(recipe_id) {
    try {
        console.log(`Getting full details for recipe ${recipe_id}`);
        
        let recipe_info = await getRecipeInformation(recipe_id);
        let recipeData = recipe_info.data;
        
        console.log(`Retrieved recipe: ${recipeData.title}`);
        console.log(`Recipe has ${recipeData.extendedIngredients?.length || 0} ingredients`);
        console.log(`Recipe has ${recipeData.analyzedInstructions?.length || 0} instruction groups`);
        
        // Return ALL the data from Spoonacular - don't filter anything!
        return recipeData;
        
    } catch (error) {
        console.error(`Error fetching recipe details for ${recipe_id}:`, error);
        
        if (error.response) {
            console.error("API Error status:", error.response.status);
            console.error("API Error data:", error.response.data);
            
            if (error.response.status === 404) {
                throw { status: 404, message: "Recipe not found" };
            } else if (error.response.status === 402) {
                throw { status: 402, message: "API quota exceeded" };
            }
        }
        
        throw { status: 500, message: "Error fetching recipe details", error: error.message };
    }
}

/**
 * Get bulk recipe information from Spoonacular API
 */
async function getRecipesPreview(recipe_ids) {
    // if recipe_ids is not an array or is empty, return an empty array
    if (!recipe_ids || recipe_ids.length === 0) {
        return [];
    }
    
    try {
        // define the API endpoint
        const ids = recipe_ids.join(',');
        
        // get recipe information from the API
        const response = await axios.get(`${api_domain}/informationBulk`, {
            params: {
                ids: ids,
                includeNutrition: false,
                apiKey: process.env.spooncular_apiKey
            }
        });
        
        return response.data.map(recipe => {
            return {
                id: recipe.id,
                title: recipe.title,
                readyInMinutes: recipe.readyInMinutes,
                image: recipe.image,
                popularity: recipe.aggregateLikes,
                vegan: recipe.vegan,
                vegetarian: recipe.vegetarian,
                glutenFree: recipe.glutenFree,
            };
        });
    } catch (error) {
        console.error("Error fetching recipes preview:", error);
        throw error;
    }
}

/**
 * Get random recipes from Spoonacular API
 */
async function getRandomRecipes(number = 3) {
    try {
        console.log(`Getting ${number} random recipes`);
        
        // get random recipes from the API
        const response = await axios.get(`${api_domain}/random`, {
            params: {
                number: number,
                apiKey: process.env.spooncular_apiKey
            }
        });
        
        if (!response.data || !response.data.recipes || !Array.isArray(response.data.recipes)) {
            console.error("Invalid response format from Spoonacular API");
            return [];
        }
        
        console.log(`Retrieved ${response.data.recipes.length} random recipes`);
        
        return response.data.recipes.map(recipe => {
            return {
                id: recipe.id,
                title: recipe.title,
                readyInMinutes: recipe.readyInMinutes,
                image: recipe.image,
                popularity: recipe.aggregateLikes || 0,
                vegan: recipe.vegan,
                vegetarian: recipe.vegetarian,
                glutenFree: recipe.glutenFree,
            };
        });
    } catch (error) {
        console.error("Error fetching random recipes:", error);
        throw error;
    }
}

/**
 * Search for recipes using Spoonacular API
 */
async function searchRecipes(params = {}) {
    try {
        console.log("Searching recipes with params:", params);
        
        const searchParams = {
            apiKey: process.env.spooncular_apiKey,
            number: params.number || 5,
            offset: params.offset || 0,
            addRecipeInformation: true, 
            fillIngredients: false,
        };
        
        // add optional parameters to searchParams
        if (params.query) {
            searchParams.query = params.query;
        }
        
        if (params.cuisine) {
            searchParams.cuisine = params.cuisine;
        }
        
        if (params.diet) {
            searchParams.diet = params.diet;
        }
        
        if (params.intolerance) {
            searchParams.intolerances = params.intolerance;
        }
        
        console.log("Sending search request to Spoonacular API");
        
        const response = await axios.get(`${api_domain}/complexSearch`, {
            params: searchParams
        });
        
        console.log("Search API response status:", response.status);
        
        // check if the response is valid
        if (!response.data || !response.data.results || !Array.isArray(response.data.results)) {
            console.error("Invalid response format from Spoonacular API:", response.data);
            return {
                results: [],
                totalResults: 0,
                currentPage: 1,
                totalPages: 1
            };
        }
        
        console.log(`Retrieved ${response.data.results.length} search results out of ${response.data.totalResults}`);
        
        const formattedResults = response.data.results.map(recipe => {
            return {
                id: recipe.id,
                title: recipe.title,
                readyInMinutes: recipe.readyInMinutes || 0,
                image: recipe.image || "",
                popularity: recipe.aggregateLikes || 0,
                vegan: recipe.vegan || false,
                vegetarian: recipe.vegetarian || false,
                glutenFree: recipe.glutenFree || false,
            };
        });
        
        // calculate pagination details
        const totalResults = response.data.totalResults || 0;
        const resultsPerPage = parseInt(params.number) || 5;
        const currentOffset = parseInt(params.offset) || 0;
        const currentPage = Math.floor(currentOffset / resultsPerPage) + 1;
        const totalPages = Math.ceil(totalResults / resultsPerPage);
        
        return {
            results: formattedResults,
            totalResults: totalResults,
            currentPage: currentPage,
            totalPages: totalPages,
            resultsPerPage: resultsPerPage
        };
    } catch (error) {
        console.error("Error searching recipes:", error);
        
        if (error.response) {
            console.error("API Error status:", error.response.status);
            console.error("API Error data:", error.response.data);
            console.error("API Error URL:", error.config.url);
            console.error("API Error params:", error.config.params);
        }
        
        throw { status: 500, message: "Error searching recipes", error: error.message };
    }
}

// get types of cuisines
async function getCuisines() {
    return [
        "African", "Asian", "American", "British", "Cajun", "Caribbean", 
        "Chinese", "Eastern European", "European", "French", "German", 
        "Greek", "Indian", "Irish", "Italian", "Japanese", "Jewish", 
        "Korean", "Latin American", "Mediterranean", "Mexican", "Middle Eastern", 
        "Nordic", "Southern", "Spanish", "Thai", "Vietnamese"
    ];
}

// get types of diets
async function getDiets() {
    return [
        "Gluten Free", "Ketogenic", "Vegetarian", "Lacto-Vegetarian", 
        "Ovo-Vegetarian", "Vegan", "Pescetarian", "Paleo", "Primal", 
        "Low FODMAP", "Whole30"
    ];
}

// get types of intolerances
async function getIntolerances() {
    return [
        "Dairy", "Egg", "Gluten", "Grain", "Peanut", "Seafood", 
        "Sesame", "Shellfish", "Soy", "Sulfite", "Tree Nut", "Wheat"
    ];
}

exports.parseRecipeId = parseRecipeId;
exports.getRecipeInformation = getRecipeInformation;
exports.getRecipeDetails = getRecipeDetails;
exports.getRecipesPreview = getRecipesPreview;
exports.getRandomRecipes = getRandomRecipes;
exports.searchRecipes = searchRecipes;
exports.getCuisines = getCuisines;
exports.getDiets = getDiets;
exports.getIntolerances = getIntolerances;
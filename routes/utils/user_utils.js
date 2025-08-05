const DButils = require("./DButils");
const recipe_utils = require("./recipes_utils");

/**
 * Mark recipe as favorite for user
 */
async function markAsFavorite(user_id, recipe_id) {
    try {
        console.log(`Marking recipe ${recipe_id} as favorite for user ${user_id}`);
        
        // ass the recipe id with ''to the favorite table- because the id of a user recipe or family recipe is string
        await DButils.execQuery(`INSERT INTO FavoriteRecipes VALUES ('${user_id}', '${recipe_id}')`);
    
        console.log(`Recipe ${recipe_id} marked as favorite for user ${user_id}`);
    } catch (error) {
        console.error(`Error marking recipe ${recipe_id} as favorite:`, error);
        throw error;
    }
}

/**
 * get all the favorite recipes for user
 */

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}

// /**
//  * add new recipe for user
//  */

// async function addUserRecipe(user_id, recipe_details) {
//     console.log("addUserRecipe called with user_id:", user_id);
//     // check that there is a user id
//     if (!user_id) {
//         throw new Error("user_id is required");
//     }
    
//     // convert the ingredients array to a JSON string
//     const ingredients = JSON.stringify(recipe_details.ingredients);
    
//     // edit the recipe details to match the database
//     const query = `
//         INSERT INTO UserRecipes 
//         (user_id, title, image, readyInMinutes, servings, vegetarian, vegan, glutenFree, ingredients, instructions) 
//         VALUES ('${user_id}', '${recipe_details.title}', '${recipe_details.image}', ${recipe_details.readyInMinutes}, 
//                 ${recipe_details.servings}, ${recipe_details.vegetarian ? 1 : 0}, ${recipe_details.vegan ? 1 : 0}, ${recipe_details.glutenFree ? 1 : 0}, 
//                 '${ingredients.replace(/'/g, "''")}', '${recipe_details.instructions.replace(/'/g, "''")}')`; 
    
//     console.log("Executing query:", query.substring(0, 200) + "..."); // הדפסת חלק מהשאילתה לדיבאג
    
//     try {
//         // execute the query to insert the recipe into the database
//                 const result = await DButils.execQuery(
//             `INSERT INTO UserRecipes (user_id, title, image, readyInMinutes, servings, vegetarian, vegan, glutenFree, ingredients, instructions) 
//              VALUES ('${user_id}', '${recipe_details.title}', '${recipe_details.image}', ${recipe_details.readyInMinutes}, 
//                     ${recipe_details.servings}, ${recipe_details.vegetarian ? 1 : 0}, ${recipe_details.vegan ? 1 : 0}, ${recipe_details.glutenFree ? 1 : 0}, 
//                     '${ingredients.replace(/'/g, "''")}', '${recipe_details.instructions.replace(/'/g, "''")}')`
//         );
        
//         // return the inserted recipe ID
//         return `u${result.insertId}`;
//     } catch (error) {
//         console.error("Error in addUserRecipe:", error);
//         throw error;
//     }
// }


/**
 * add new recipe for user
 */
async function addUserRecipe(user_id, recipe_details) {
    console.log("addUserRecipe called with user_id:", user_id);
    console.log("Recipe details:", JSON.stringify(recipe_details, null, 2));
    
    // check that there is a user id
    if (!user_id) {
        throw new Error("user_id is required");
    }
    
    try {
        // convert the ingredients array to a JSON string
        const ingredients = JSON.stringify(recipe_details.ingredients);
        console.log("Ingredients JSON:", ingredients);
        
        // Use parameterized query to avoid SQL injection and handle special characters
        const query = `
            INSERT INTO UserRecipes 
            (user_id, title, image, readyInMinutes, servings, vegetarian, vegan, glutenFree, ingredients, instructions) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            user_id,
            recipe_details.title,
            recipe_details.image,
            recipe_details.readyInMinutes,
            recipe_details.servings,
            recipe_details.vegetarian ? 1 : 0,
            recipe_details.vegan ? 1 : 0,
            recipe_details.glutenFree ? 1 : 0,
            ingredients,
            recipe_details.instructions
        ];
        
        console.log("Executing parameterized query with params:", params);
        
        // execute the query to insert the recipe into the database
        const result = await DButils.execQuery(query, params);
        
        console.log("Query result:", result);
        
        // return the inserted recipe ID
        return `u${result.insertId}`;
    } catch (error) {
        console.error("Error in addUserRecipe:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            sqlState: error.sqlState,
            sql: error.sql
        });
        throw error;
    }
}

/**
 * Get user recipes, optionally filtered by recipe_id
 */
async function getUserRecipes(user_id, specific_recipe_id = null) {
    try {
        console.log("Getting recipes for user ID:", user_id, specific_recipe_id ? `with specific ID: ${specific_recipe_id}` : "");
        
        // build the query - with or without filtering by specific recipe ID
        let query = `
            SELECT recipe_id, title, image, readyInMinutes, servings, vegetarian, vegan, glutenFree, ingredients, instructions 
            FROM UserRecipes 
            WHERE user_id = '${user_id}'
        `;
        
        if (specific_recipe_id !== null) {
            query += ` AND recipe_id = ${specific_recipe_id}`;
        }
        
        // execute the query
        const recipes = await DButils.execQuery(query);
        
        // if looking for a specific recipe and it is not found throw 404 error
        if (specific_recipe_id !== null && recipes.length === 0) {
            throw { status: 404, message: "Recipe not found" };
        }
        
        // convert the response to the desired format
        const processedRecipes = recipes.map(recipe => {
            let ingredientsArray = [];
            try {
                if (recipe.ingredients) {
                    ingredientsArray = JSON.parse(recipe.ingredients);
                }
            } catch (error) {
                console.error("Error parsing ingredients:", error);
            }
            
            return {
                id: `u${recipe.recipe_id}`,
                title: recipe.title,
                image: recipe.image,
                readyInMinutes: recipe.readyInMinutes,
                servings: recipe.servings,
                vegetarian: recipe.vegetarian === 1,
                vegan: recipe.vegan === 1,
                glutenFree: recipe.glutenFree === 1,
                ingredients: ingredientsArray,
                instructions: recipe.instructions
            };
        });
        
        // if looking for a specific recipe, return it directly, otherwise return the full array
        return specific_recipe_id !== null ? processedRecipes[0] : processedRecipes;
    } catch (error) {
        console.error("Error in getUserRecipes:", error);
        throw error;
    }
}

/**
 * Get family recipes, optionally filtered by recipe_id
 */
// async function getFamilyRecipes(user_id, specific_recipe_id = null) {
//     try {
//         console.log("Getting family recipes for user ID:", user_id, specific_recipe_id ? `with specific ID: ${specific_recipe_id}` : "");
        
//         // build the query - with or without filtering by specific recipe ID
//         let query = `
//             SELECT recipe_id, title, image, author, whenToMake, ingredients, instructions,
//                 readyInMinutes, servings, vegetarian, vegan, glutenFree
//             FROM FamilyRecipes 
//             WHERE user_id = '${user_id}'
//         `;
        
//         if (specific_recipe_id !== null) {
//             query += ` AND recipe_id = ${specific_recipe_id}`;
//         }
        
//         // execute the query
//         const recipes = await DButils.execQuery(query);
        
//         // if looking for a specific recipe and it is not found throw 404 error
//         if (specific_recipe_id !== null && recipes.length === 0) {
//             throw { status: 404, message: "Recipe not found" };
//         }
        
//         // convert the response to the desired format
//         const processedRecipes = recipes.map(recipe => {
//             let ingredientsArray = [];
//             try {
//                 if (recipe.ingredients) {
//                     ingredientsArray = JSON.parse(recipe.ingredients);
//                 }
//             } catch (error) {
//                 console.error("Error parsing ingredients:", error);
//             }
//             // retuen the recipe in the desired format
//             return {
//                 id: `f${recipe.recipe_id}`,
//                 title: recipe.title,
//                 image: recipe.image,
//                 author: recipe.author,
//                 whenToMake: recipe.whenToMake,
//                 ingredients: ingredientsArray,
//                 instructions: recipe.instructions,
//                 readyInMinutes: recipe.readyInMinutes || 0,
//                 servings: recipe.servings || 1,
//                 vegetarian: Boolean(recipe.vegetarian),
//                 vegan: Boolean(recipe.vegan),
//                 glutenFree: Boolean(recipe.glutenFree),
//                 // להוספת תאימות עם מתכונים רגילים:
//                 aggregateLikes: 0, // מתכונים משפחתיים אין להם לייקים
//                 popularity: 0
//                         };
//         });
        
//         // if looking for a specific recipe, return it directly, otherwise return the full array
//         return specific_recipe_id !== null ? processedRecipes[0] : processedRecipes;
//     } catch (error) {
//         console.error("Error in getFamilyRecipes:", error);
//         throw error;
//     }
// }

async function getFamilyRecipes(user_id, specific_recipe_id = null) {
    try {
        console.log("Getting family recipes for user ID:", user_id, specific_recipe_id ? `with specific ID: ${specific_recipe_id}` : "");
        
        // build the query - כלול את כל השדות הנדרשים
        let query = `
            SELECT recipe_id, title, image, author, whenToMake, ingredients, instructions,
                   readyInMinutes, servings, vegetarian, vegan, glutenFree
            FROM FamilyRecipes 
            WHERE user_id = '${user_id}'
        `;
        
        if (specific_recipe_id !== null) {
            query += ` AND recipe_id = ${specific_recipe_id}`;
        }
        
        // execute the query
        const recipes = await DButils.execQuery(query);
        
        // if looking for a specific recipe and it is not found throw 404 error
        if (specific_recipe_id !== null && recipes.length === 0) {
            throw { status: 404, message: "Recipe not found" };
        }
        
        // convert the response to the desired format
        const processedRecipes = await Promise.all(recipes.map(async recipe => {
            let ingredientsArray = [];
            
            try {
                if (recipe.ingredients) {
                    ingredientsArray = JSON.parse(recipe.ingredients);
                }
            } catch (error) {
                console.error("Error parsing ingredients:", error);
            }
            
            // טען תמונות גלריה לכל מתכון משפחתי (אם הפונקציה קיימת)
            let galleryImages = [];
            try {
                if (typeof getFamilyRecipeGallery === 'function') {
                    galleryImages = await getFamilyRecipeGallery(recipe.recipe_id);
                }
            } catch (error) {
                console.log("Gallery not available:", error);
            }
            
            // return the recipe in the desired format
            return {
                id: `f${recipe.recipe_id}`,
                title: recipe.title,
                image: recipe.image,
                author: recipe.author,
                whenToMake: recipe.whenToMake,
                ingredients: ingredientsArray,
                instructions: recipe.instructions,
                gallery: galleryImages,
                // הוסף את השדות החסרים
                readyInMinutes: recipe.readyInMinutes || 0,
                servings: recipe.servings || 1,
                vegetarian: recipe.vegetarian === 1,
                vegan: recipe.vegan === 1,
                glutenFree: recipe.glutenFree === 1,
                // הוסף שדות נוספים לתאימות
                popularity: 0,
                aggregateLikes: 0
            };
        }));
        
        // if looking for a specific recipe, return it directly, otherwise return the full array
        return specific_recipe_id !== null ? processedRecipes[0] : processedRecipes;
    } catch (error) {
        console.error("Error in getFamilyRecipes:", error);
        throw error;
    }
}


/**
 * Add a family recipe for a user
 */
async function addFamilyRecipe(user_id, recipe_details) {
    try {
        console.log("Adding family recipe for user ID:", user_id);
        
        // check that there are all required fields
        const requiredFields = ['title', 'author', 'whenToMake', 'ingredients', 'instructions'];
        for (const field of requiredFields) {
            if (!recipe_details[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // convert the ingredients array to a JSON string
        const ingredients = JSON.stringify(recipe_details.ingredients);
        
        // add the recipe to the database
        const result = await DButils.execQuery(
            `INSERT INTO FamilyRecipes (user_id, title, image, author, whenToMake, ingredients, instructions) 
             VALUES ('${user_id}', '${recipe_details.title}', '${recipe_details.image || ""}', '${recipe_details.author}', 
             '${recipe_details.whenToMake}', '${ingredients.replace(/'/g, "''")}', '${recipe_details.instructions.replace(/'/g, "''")}')`
        );
        
        // return the inserted recipe ID
        return `f${result.insertId}`;
    } catch (error) {
        console.error("Error in addFamilyRecipe:", error);
        throw error;
    }
}

/**
 * Mark a recipe as viewed by a user
 */
async function markRecipeAsViewed(user_id, recipe_id) {
    try {
        console.log(`Marking recipe ${recipe_id} as viewed by user ${user_id}`);
        
        // check if its a user or family recipe
        const parsedId = recipe_utils.parseRecipeId(recipe_id);
        const storedId = recipe_id;
        
        // get the search time 
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        // check if the recipe is already viewed
        const existingRecords = await DButils.execQuery(
            `SELECT * FROM LastViewedRecipes WHERE user_id = '${user_id}' AND recipe_id = '${storedId}'`
        );
        
        if (existingRecords.length > 0) {
            // update the view time if the recipe was already viewed
            await DButils.execQuery(
                `UPDATE LastViewedRecipes 
                 SET view_time = '${now}' 
                 WHERE user_id = '${user_id}' AND recipe_id = '${storedId}'`
            );
            console.log(`Updated view time for recipe ${recipe_id}`);
        } else {
            // add a new record if the recipe was not viewed before
            await DButils.execQuery(
                `INSERT INTO LastViewedRecipes (user_id, recipe_id, view_time) 
                 VALUES ('${user_id}', '${storedId}', '${now}')`
            );
            console.log(`Added new record for recipe ${recipe_id}`);
        }
    } catch (error) {
        console.error(`Error marking recipe ${recipe_id} as viewed:`, error);
        throw error;
    }
}

/**
 * Get last viewed recipes for a user
 */
async function getLastViewedRecipes(user_id, limit = 3) {
    try {
        console.log(`Getting last ${limit} viewed recipes for user ${user_id}`);
        
        // get the last viewed recipes from the database
        // the recipes are ordered by view time in descending order
        const viewedRecipes = await DButils.execQuery(
            `SELECT recipe_id, view_time 
             FROM LastViewedRecipes 
             WHERE user_id = '${user_id}' 
             ORDER BY view_time DESC 
             LIMIT ${limit}`
        );
        
        console.log(`Found ${viewedRecipes.length} viewed recipes`);
        
        if (viewedRecipes.length === 0) {
            return [];
        }
        
        const spoonacularIds = [];
        const userRecipeIds = [];
        const familyRecipeIds = [];
        
        viewedRecipes.forEach(recipe => {
            const recipeId = recipe.recipe_id;
            const parsed = recipe_utils.parseRecipeId(recipeId);
            
            if (parsed.type === 'user') {
                userRecipeIds.push(parsed.id);
            } else if (parsed.type === 'family') {
                familyRecipeIds.push(parsed.id);
            } else {
                spoonacularIds.push(parsed.id);
            }
        });
        
        const allRecipes = [];
        
        // getting recipes from spoonacular
        if (spoonacularIds.length > 0) {
            console.log(`Fetching ${spoonacularIds.length} recipes from Spoonacular`);
            try {
                const spoonacularRecipes = await recipe_utils.getRecipesPreview(spoonacularIds);
                allRecipes.push(...spoonacularRecipes);
            } catch (error) {
                console.error("Error fetching Spoonacular recipes:", error);
            }
        }
        
        // getting user recipes
        if (userRecipeIds.length > 0) {
            console.log(`Fetching ${userRecipeIds.length} user recipes`);
            for (const id of userRecipeIds) {
                try {
                    const userRecipe = await getUserRecipes(user_id, id);
                    if (userRecipe) {
                        const preview = {
                            id: `u${id}`,
                            title: userRecipe.title,
                            readyInMinutes: userRecipe.readyInMinutes,
                            image: userRecipe.image,
                            popularity: 0,
                            vegan: userRecipe.vegan,
                            vegetarian: userRecipe.vegetarian,
                            glutenFree: userRecipe.glutenFree,
                            viewed: true,
                            favorite: false 
                        };
                        allRecipes.push(preview);
                    }
                } catch (error) {
                    console.error(`Error fetching user recipe ${id}:`, error);
                }
            }
        }
        
        // getting family recipes
        if (familyRecipeIds.length > 0) {
            console.log(`Fetching ${familyRecipeIds.length} family recipes`);
            for (const id of familyRecipeIds) {
                try {
                    const familyRecipe = await getFamilyRecipes(user_id, id);
                    if (familyRecipe) {
                        const preview = {
                            id: `f${id}`,
                            title: familyRecipe.title,
                            image: familyRecipe.image,
                            readyInMinutes: 0, 
                            popularity: 0,
                            vegan: false,   
                            vegetarian: false,
                            glutenFree: false,
                            viewed: true,
                            favorite: false
                        };
                        allRecipes.push(preview);
                    }
                } catch (error) {
                    console.error(`Error fetching family recipe ${id}:`, error);
                }
            }
        }
        
        // sort the recipes by view time
        const orderedRecipes = [];
        
        viewedRecipes.forEach(viewedRecipe => {
            const recipeId = viewedRecipe.recipe_id;
            const parsed = recipe_utils.parseRecipeId(recipeId);
            
            let foundRecipe;
            
            if (parsed.type === 'user') {
                foundRecipe = allRecipes.find(r => r.id === `u${parsed.id}`);
            } else if (parsed.type === 'family') {
                foundRecipe = allRecipes.find(r => r.id === `f${parsed.id}`);
            } else {
                foundRecipe = allRecipes.find(r => r.id.toString() === parsed.id.toString());
            }
            
            if (foundRecipe) {
                orderedRecipes.push(foundRecipe);
            }
        });
        
        console.log(`Returning ${orderedRecipes.length} viewed recipes`);
        return orderedRecipes;
    } catch (error) {
        console.error("Error in getLastViewedRecipes:", error);
        throw error;
    }
}

async function getViewedRecipeIds(user_id) {
  try {
    const viewed = await DButils.execQuery(
      `SELECT recipe_id FROM LastViewedRecipes WHERE user_id = '${user_id}'`
    );
    return viewed.map(item => item.recipe_id);
  } catch (error) {
    console.error("Error getting viewed recipe IDs:", error);
    return [];
  }
}

async function getFavoriteRecipeIds(user_id) {
  try {
    const favorites = await DButils.execQuery(
      `SELECT recipe_id FROM FavoriteRecipes WHERE user_id = '${user_id}'`
    );
    return favorites.map(item => item.recipe_id);
  } catch (error) {
    console.error("Error getting favorite recipe IDs:", error);
    return [];
  }
}

/**
 * Check if a recipe was viewed by user
 */
async function isRecipeViewed(user_id, recipe_id) {
  try {
    const viewed = await DButils.execQuery(
      `SELECT 1 FROM LastViewedRecipes WHERE user_id = '${user_id}' AND recipe_id = '${recipe_id}'`
    );
    return viewed.length > 0;
  } catch (error) {
    console.error(`Error checking if recipe ${recipe_id} was viewed:`, error);
    return false;
  }
}


/**
 * Get gallery images for a specific family recipe
 */
async function getFamilyRecipeGallery(recipe_id) {
    try {
        console.log("Getting gallery images for family recipe ID:", recipe_id);
        
        const query = `
            SELECT image_url, caption, sort_order
            FROM FamilyRecipeGallery 
            WHERE recipe_id = ${recipe_id}
            ORDER BY sort_order ASC
        `;
        
        const galleryImages = await DButils.execQuery(query);
        
        // המר לפורמט הנכון
        return galleryImages.map(img => ({
            url: img.image_url,
            caption: img.caption
        }));
        
    } catch (error) {
        console.error("Error getting family recipe gallery:", error);
        return []; // החזר מערך ריק במקרה של שגיאה
    }
}


exports.markRecipeAsViewed = markRecipeAsViewed;
exports.getLastViewedRecipes = getLastViewedRecipes;
exports.addFamilyRecipe = addFamilyRecipe;
exports.getFamilyRecipes = getFamilyRecipes;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.addUserRecipe = addUserRecipe;
exports.getUserRecipes = getUserRecipes;
exports.getViewedRecipeIds = getViewedRecipeIds;
exports.getFavoriteRecipeIds = getFavoriteRecipeIds;
exports.isRecipeViewed = isRecipeViewed;
exports.getFamilyRecipeGallery = getFamilyRecipeGallery;

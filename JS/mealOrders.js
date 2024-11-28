// PLEASE NOTE: I'm not quite sure what you want me to do with point 2.3 of the task
// i.e keeping track of last generated order so I don't have to loop through orders
// when storing them. I don't need to loop through them either way since I just
// stringify the currentOrders array and set item. Unless I'm missing something
// this point seems redundant, so I have not included it. This also means I did not include
// point 4.2 because I would have no use for it.
let sessionData;
let mainIngredient;
let mainIngredientReformatted;
let currentOrders = [];

//We create our foodOrder class constructor
class foodOrder{
	constructor(description, orderNumber, completionStatus){
		this.description = description;
		this.orderNumber = orderNumber;
		this.completionStatus = completionStatus;
	}
}

// Our first function is to check if session was already active
// if yes, we load relevant data, otherwise create relevant data.
// Note this is wrapped in a try-catch, since if a user cancels the initial
// input of an ingredient and reloads the page, the session data is created,
// but contains nothing, so it throws an error on trying to parse orders from session storage.
// in this case, when we get an error, we treat it as if sessiondata does not exist.
function checkLoadableData() {
	try {
		if (sessionStorage.getItem("sessionDataExists") === null) {
			sessionStorage.setItem("sessionDataExists", true);
			sessionStorage.setItem("sessionCurrentOrders", [])
		} else {
			currentOrders = JSON.parse(sessionStorage.getItem("sessionCurrentOrders"));
		}
	} catch (error) {
		sessionStorage.setItem("sessionDataExists", true);
		sessionStorage.setItem("sessionCurrentOrders", []);
		console.log("ERROR: " + error);
	}
}

// Async function for our return random meal. This is async because we must await
// the API call and info return from our getMealsByIngredient function.
// I split these functions for future modularity since we might want all meals by ingredient,
// but without picking a random result.
async function returnRandomMeal(ingredient) {
	// Get possible recipes
	let possibleRecipes = await getMealsByIngredient(ingredient);
	// Since math.random gives a number between 0-1, we times it by number of possible recipes and then floor the result.
	let chosenRandomMealNumber = Math.floor(Math.random() * possibleRecipes.length);
	// Finally, pick the random meal number from the array.
	let chosenMeal = possibleRecipes[chosenRandomMealNumber];

	// If chosenMeal is undefined or null, which can happen if the returned array doesn't have any elements
	// we alert, and prompt for a new ingredient in a do-while, which keeps running
	// until we do not get a null/undefined input.
	if (!chosenMeal)
	{
		alert(`${mainIngredient} is not a main ingredient in any meals.`);

		do {
			mainIngredient = prompt("Please provide the Main Ingredient you want in your meal.");
			if (!mainIngredient) {
					alert("Invalid entry provided.");
			}
		} while (!mainIngredient);
		mainIngredientReformatted = mainIngredient.toLowerCase();
		mainIngredientReformatted = mainIngredientReformatted.replace(" ", "_");

		// Recursion on current function to handle api call and picking of random meal again.
		returnRandomMeal(mainIngredientReformatted);
	} else {
		// If the chosenMeal was a valid option, we create a new foodOrder with description, orderNumber, and preparation status.
		// We then push it to currentOrders array and stringify onto sessionStorage to save.
		currentOrders.push(new foodOrder(chosenMeal.strMeal, `OR${currentOrders.length + 1}`, "incomplete"));
		sessionStorage.setItem("sessionCurrentOrders", JSON.stringify(currentOrders));
		// We call showIncomplete Orders after getting a random meal and pushing to currentOrders array
		showIncompleteOrders();
	}
}

// async function for our API call to themealdb. If our fetched item status is not .ok,
// we throw an error. Otherwise we await item.json. If the ingredient entered doesn't exist/
// yields no meals, we log that our ingredient is not a main ingredient, otherwise we push all
// possible recipes into a recipe array, which we return.
async function getMealsByIngredient(ingredient) {
	const recipes = [];
	const item = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);

	if (!item.ok)
	{
		throw new Error(`NETWORK ERROR: ${item.status}`);
	}
	
	const itemJSON = await item.json();

	if (!itemJSON.meals)
	{
		console.log(`${mainIngredient} is not a main ingredient in any meals.`);
	} else {
		for (const element of itemJSON.meals) {
				recipes.push(element);
		};
	}
	
	return recipes;
}

// This function creates a prompt by filtering currentOrders by 'incomplete' orders only
// We then build the string before displaying it and asking the client to
// either enter an order number to mark as complete, or 0 to do nothing.
// Any invalid inputs causes recursion on this method.
function showIncompleteOrders() {
	let orderNumberToComplete;
	let tempOrderString = `List of Incomplete Orders:\n`;
	let tempIncompleteOrderNumbers = [];

	let filteredIncompleteOnlyOrders = currentOrders.filter((order) => { return order.completionStatus === "incomplete" });

	for (const element of filteredIncompleteOnlyOrders) {
		tempOrderString += `\n${element.description} : ${element.orderNumber}`;
		tempIncompleteOrderNumbers.push(element.orderNumber);
	}

	tempOrderString += `\n\nEnter 0 to make no changes or enter Order Number to mark it as complete.`;

	orderNumberToComplete = prompt(tempOrderString).toUpperCase();

	if (orderNumberToComplete === "0")
	{
		console.log("Making no Changes.")
		console.table(currentOrders);
	}
	else if (tempIncompleteOrderNumbers.includes(orderNumberToComplete)) {
		console.log(`Marking order ${orderNumberToComplete} as complete`);
		// We call markOrderComplete with the entered order number if it is valid.
		markOrderComplete(orderNumberToComplete);
	}
	else {
		alert("Invalid order number entered.");
		showIncompleteOrders();
	}
}

// Iterate through our currentOrders and if the order number matches the input order number
// we change its completionStatus to completed.
// We don't need to error handle here, as when we prompt for the orderNumber from client
// in showIncompleteOrders(), we are already handling incorrect inputs.
function markOrderComplete(orderNumber) {
	for (const element of currentOrders) {
		if (element.orderNumber === orderNumber)
		{
				element.completionStatus = "completed";
		}
	}

	sessionStorage.setItem("sessionCurrentOrders", JSON.stringify(currentOrders));
	console.table(currentOrders);
}

// Start program by checking loadable sessionStorage data.
checkLoadableData();

// Use a do-while to make sure we do not get a null/undefined input for our mainIngredient.
do {
	mainIngredient = prompt("Please provide the Main Ingredient you want in your meal.");
	if (!mainIngredient) {
		alert("Invalid entry provided.");
	}
} while (!mainIngredient);
// After something valid is entered, we toLowerCase and replace spaces with "_"
// We do this AFTER our do-while to avoid errors being through from trying to toLowerCase
// null/undefined inputs. We use mainIngredientReformatted, so we can keep mainIngredient
// as the user entered it for display back to them in case of errors.
mainIngredientReformatted = mainIngredient.toLowerCase();
mainIngredientReformatted = mainIngredientReformatted.replace(" ", "_");

// Finally, call returnRandomMeal which starts the chain of api calling for all meals,
// choosing a random one, and adding it to our currentOrders array.
returnRandomMeal(mainIngredientReformatted);
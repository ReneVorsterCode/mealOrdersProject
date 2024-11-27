//PLEASE NOTE: I'm not quite sure what you want me to do with point 2.3 of the task
//i.e keeping track of last generated order so I don't have to loop through orders
//when storing them. I don't need to loop through them either way since I just
//stringify the currentOrders array and set item. Unless I'm missing something
//this point seems redundant, so I have not included it. This also means I did not include
//point 4.2 because I would have no use for it.
let sessionData;
let mainIngredient;
let currentOrders = [];

class foodOrder{
    constructor(description, orderNumber, completionStatus){
        this.description = description;
        this.orderNumber = orderNumber;
        this.completionStatus = completionStatus;
    }
}

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

async function returnRandomMeal(ingredient) {
    let possibleRecipes = await getMealsByIngredient(ingredient);
    let chosenRandomMealNumber = Math.floor(Math.random() * possibleRecipes.length);
    let chosenMeal = possibleRecipes[chosenRandomMealNumber];

    if (!chosenMeal)
    {
        alert(`${mainIngredient} is not a main ingredient in any meals.`);

        do {
            mainIngredient = prompt("Please provide the Main Ingredient you want in your meal.");
            if (!mainIngredient) {
                alert("Invalid entry provided.");
            }
        } while (!mainIngredient);
        mainIngredient.toLowerCase().replace(" ", "_");

        returnRandomMeal(mainIngredient);
    } else {
        currentOrders.push(new foodOrder(chosenMeal.strMeal, `OR${currentOrders.length + 1}`, "incomplete"));
        sessionStorage.setItem("sessionCurrentOrders", JSON.stringify(currentOrders));

        console.log(currentOrders.length);
        showIncompleteOrders();
    }
}

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
        markOrderComplete(orderNumberToComplete);
    }
    else {
        alert("Invalid order number entered.");
        showIncompleteOrders();
    }
}

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

checkLoadableData();

do {
    mainIngredient = prompt("Please provide the Main Ingredient you want in your meal.");
    if (!mainIngredient) {
        alert("Invalid entry provided.");
    }
} while (!mainIngredient);
mainIngredient.toLowerCase().replace(" ", "_");

returnRandomMeal(mainIngredient);
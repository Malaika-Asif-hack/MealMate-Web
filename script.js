// Global variables
let currentUser = null;

// Get meal icon
function getMealIcon(mealType) {
    const icons = {
        'breakfast': '🍳',
        'lunch': '🥗',
        'dinner': '🍲',
        'snack': '🍎'
    };
    return icons[mealType] || '🍽️';
}

// Add quick meal from dashboard
async function addQuickMeal() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const mealType = document.getElementById('quickMealType').value;
    const foodName = document.getElementById('quickFoodName').value;
    const calories = parseInt(document.getElementById('quickCalories').value);
    const today = new Date().toISOString().split('T')[0];

    if (!foodName || !calories) {
        alert('Please fill all fields');
        return;
    }

    try {
        await db.collection('meals').add({
            userId: user.uid,
            date: today,
            mealType: mealType,
            foodName: foodName,
            calories: calories,
            timestamp: new Date()
        });
        
        document.getElementById('quickFoodName').value = '';
        document.getElementById('quickCalories').value = '';
        loadTodayMeals();
        loadDailySummary();
    } catch (error) {
        alert('Error adding meal: ' + error.message);
    }
}

// Load today's meals
async function loadTodayMeals() {
    const user = auth.currentUser;
    if (!user) return;

    const selectedDate = document.getElementById('dateFilter')?.value || new Date().toISOString().split('T')[0];
    const mealsList = document.getElementById('mealsList');
    if (!mealsList) return;

    const snapshot = await db.collection('meals')
        .where('userId', '==', user.uid)
        .where('date', '==', selectedDate)
        .orderBy('timestamp', 'desc')
        .get();
    
    mealsList.innerHTML = '';
    
    snapshot.forEach(doc => {
        const meal = doc.data();
        const row = mealsList.insertRow();
        row.insertCell(0).textContent = getMealIcon(meal.mealType) + ' ' + meal.mealType;
        row.insertCell(1).textContent = meal.foodName;
        row.insertCell(2).textContent = meal.calories;
        row.insertCell(3).innerHTML = `
            <button class="edit-btn" onclick="editMeal('${doc.id}', '${meal.foodName}', ${meal.calories}, '${meal.mealType}')">Edit</button>
            <button class="delete-btn" onclick="deleteMeal('${doc.id}')">Delete</button>
        `;
    });
    
    if (snapshot.empty) {
        mealsList.innerHTML = '<tr><td colspan="4" style="text-align:center">No meals logged for this day</td></tr>';
    }
}

// Load daily summary
async function loadDailySummary() {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const snapshot = await db.collection('meals')
        .where('userId', '==', user.uid)
        .where('date', '==', today)
        .get();
    
    let totalCalories = 0;
    snapshot.forEach(doc => {
        totalCalories += doc.data().calories;
    });
    
    const userDoc = await db.collection('users').doc(user.uid).get();
    const goal = userDoc.exists ? userDoc.data().calorieGoal : 2000;
    
    const todayCaloriesSpan = document.getElementById('todayCalories');
    const goalSpan = document.getElementById('goalCalories');
    const progressFill = document.getElementById('progressFill');
    const remainingSpan = document.getElementById('remainingCalories');
    
    if (todayCaloriesSpan) todayCaloriesSpan.textContent = totalCalories;
    if (goalSpan) goalSpan.textContent = goal;
    
    if (progressFill) {
        const percentage = (totalCalories / goal) * 100;
        const fillWidth = Math.min(percentage, 100);
        progressFill.style.width = fillWidth + '%';
        progressFill.textContent = Math.round(percentage) + '%';
    }
    
    if (remainingSpan) {
        const remaining = goal - totalCalories;
        remainingSpan.innerHTML = remaining > 0 ? 
            `${remaining} calories remaining` : 
            `⚠️ You've exceeded your daily goal by ${Math.abs(remaining)} calories`;
    }
}

// Delete meal
async function deleteMeal(mealId) {
    if (confirm('Are you sure you want to delete this meal?')) {
        await db.collection('meals').doc(mealId).delete();
        loadTodayMeals();
        loadDailySummary();
    }
}

// Edit meal
function editMeal(mealId, currentFoodName, currentCalories, currentMealType) {
    const newFoodName = prompt('Edit food name:', currentFoodName);
    if (newFoodName && newFoodName !== currentFoodName) {
        const newCalories = prompt('Edit calories:', currentCalories);
        const newMealType = prompt('Edit meal type (breakfast/lunch/dinner/snack):', currentMealType);
        
        db.collection('meals').doc(mealId).update({
            foodName: newFoodName,
            calories: parseInt(newCalories),
            mealType: newMealType.toLowerCase()
        }).then(() => {
            loadTodayMeals();
            loadDailySummary();
        });
    }
}

// Load user name on dashboard
async function loadUserName() {
    const user = auth.currentUser;
    if (!user) return;
    
    const doc = await db.collection('users').doc(user.uid).get();
    const userNameSpan = document.getElementById('userName');
    const currentDateSpan = document.getElementById('currentDate');
    
    if (userNameSpan && doc.exists) {
        userNameSpan.textContent = doc.data().name;
    }
    if (currentDateSpan) {
        currentDateSpan.textContent = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}

// Logout function
function logout() {
    auth.signOut();
    window.location.href = 'login.html';
}

// Initialize dashboard if on dashboard page
if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.value = new Date().toISOString().split('T')[0];
            dateFilter.addEventListener('change', () => {
                loadTodayMeals();
            });
        }
    });
}

// Auth state listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        if (window.location.pathname.includes('dashboard.html')) {
            loadUserName();
            loadTodayMeals();
            loadDailySummary();
        }
    } else if (!window.location.pathname.includes('login.html') && 
               !window.location.pathname.includes('register.html') &&
               !window.location.pathname.includes('splash.html')) {
        window.location.href = 'login.html';
    }
});
class BottleGame {
    constructor() {
        console.log('Initializing game...');
        this.bottles = [];
        this.selectedBottle = null;
        this.colors = ['#f28b82', '#aecbfa', '#ccff90', '#ffd6a5', '#d7aefb'];
        this.bottlesContainer = document.getElementById('bottles-container');
        this.resetButton = document.getElementById('reset-button');
        
        // Debug check for DOM elements
        console.log('Bottles container:', this.bottlesContainer);
        console.log('Reset button:', this.resetButton);
        
        if (!this.bottlesContainer) {
            console.error('bottles-container element not found!');
            return;
        }
        
        this.isAnimating = false;
        
        // Get or create victory message element
        this.victoryMessage = document.getElementById('victory-message');
        if (!this.victoryMessage) {
            this.victoryMessage = document.createElement('div');
            this.victoryMessage.id = 'victory-message';
            this.victoryMessage.className = 'victory-message';
            // Insert after bottles container
            this.bottlesContainer.after(this.victoryMessage);
        }
        this.victoryMessage.textContent = 'Congratulations! You won!';
        
        this.setupEventListeners();
        this.init();
    }

    setupEventListeners() {
        // Set up event listeners once during construction
        this.bottlesContainer.addEventListener('click', (e) => {
            const bottle = e.target.closest('.bottle');
            if (!bottle) return;

            const bottleIndex = parseInt(bottle.dataset.index);
            this.handleBottleClick(bottleIndex);
        });

        this.resetButton.addEventListener('click', () => {
            this.init();
        });
    }

    init() {
        console.log('Starting new game...');
        // Hide victory message when starting new game
        if (this.victoryMessage) {
            this.victoryMessage.classList.remove('show');
        }
        
        // Create 7 bottles (4 with colors, 3 empty)
        this.bottles = Array(7).fill().map(() => []);
        this.selectedBottle = null;
        
        let isValidDistribution = false;
        
        while (!isValidDistribution) {
            // Reset bottles
            this.bottles = Array(7).fill().map(() => []);
            
            // Create exactly 4 segments for each color
            let allSegments = [];
            this.colors.forEach(color => {
                allSegments.push(...Array(4).fill(color));
            });
            
            // Shuffle the segments
            for (let i = allSegments.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allSegments[i], allSegments[j]] = [allSegments[j], allSegments[i]];
            }
            
            // Distribute segments evenly across the first 4 bottles
            for (let i = 0; i < allSegments.length; i++) {
                const bottleIndex = Math.floor(i / 4);
                this.bottles[bottleIndex].push(allSegments[i]);
            }
            
            // Check if distribution is valid (no bottle has all same colors)
            isValidDistribution = this.bottles.every(bottle => {
                if (bottle.length === 0) return true;
                return !bottle.every(color => color === bottle[0]);
            });
        }
        
        console.log('Bottles array created:', this.bottles);
        this.renderBottles();
    }

    renderBottles() {
        console.log('Rendering bottles...');
        if (!this.bottlesContainer) {
            console.error('Cannot render: bottles-container is null');
            return;
        }

        // Clear the bottles container
        this.bottlesContainer.innerHTML = '';
        console.log('Cleared bottles container');

        // Create and append all bottles
        this.bottles.forEach((bottle, index) => {
            const bottleElement = document.createElement('div');
            bottleElement.className = 'bottle';
            bottleElement.dataset.index = index;

            // Add celebration effect if bottle is complete
            if (this.isBottleComplete(bottle)) {
                bottleElement.classList.add('complete');
                // Don't create confetti on initial render to avoid spam
                // this.createConfetti(bottleElement);
            }

            bottle.forEach((color, colorIndex) => {
                const segment = document.createElement('div');
                segment.className = 'color-segment';
                segment.style.backgroundColor = color;
                segment.style.bottom = `${colorIndex * 25}%`;
                bottleElement.appendChild(segment);
            });

            this.bottlesContainer.appendChild(bottleElement);
            console.log(`Added bottle ${index} with ${bottle.length} segments`);
        });
        
        console.log('Finished rendering bottles');
        console.log('Current DOM structure:', this.bottlesContainer.innerHTML);
    }

    handleBottleClick(bottleIndex) {
        if (this.isAnimating) return;
        
        const bottles = document.querySelectorAll('.bottle');
        
        if (this.selectedBottle === null) {
            // Select bottle if it's not empty
            if (this.bottles[bottleIndex].length > 0) {
                this.selectedBottle = bottleIndex;
                bottles[bottleIndex].classList.add('selected');
            }
        } else {
            // Check if pour is valid
            if (this.canPour(this.selectedBottle, bottleIndex)) {
                this.animatePour(this.selectedBottle, bottleIndex);
            } else {
                // Show error animation if colors don't match
                const fromBottle = this.bottles[this.selectedBottle];
                const toBottle = this.bottles[bottleIndex];
                
                if (fromBottle.length > 0 && 
                    toBottle.length > 0 && 
                    toBottle.length < 4 && 
                    fromBottle[fromBottle.length - 1] !== toBottle[toBottle.length - 1]) {
                    this.showErrorAnimation(bottles[bottleIndex]);
                }
            }
            
            // Deselect the bottle
            bottles[this.selectedBottle].classList.remove('selected');
            this.selectedBottle = null;
        }
    }

    async animatePour(fromIndex, toIndex) {
        this.isAnimating = true;
        const bottles = document.querySelectorAll('.bottle');
        const fromBottle = bottles[fromIndex];
        const toBottle = bottles[toIndex];

        // Determine pouring direction based on bottle positions
        const fromRect = fromBottle.getBoundingClientRect();
        const toRect = toBottle.getBoundingClientRect();
        const pourDirection = fromRect.left < toRect.left ? 'right' : 'left';

        // Add animation classes to bottles
        fromBottle.classList.add(`pouring-${pourDirection}`);
        toBottle.classList.add('receiving');

        // Wait for pour animation
        await new Promise(resolve => setTimeout(resolve, 700));

        // Perform the pour
        this.pour(fromIndex, toIndex);
        this.renderBottles();

        // Remove animation classes from the newly rendered bottles
        const updatedBottles = document.querySelectorAll('.bottle');
        updatedBottles[fromIndex].classList.remove(`pouring-${pourDirection}`);
        updatedBottles[toIndex].classList.remove('receiving');

        // Check for win after animation
        if (this.checkWin()) {
            this.victoryMessage.classList.add('show');
            setTimeout(() => {
                this.init();
            }, 2000);
        }

        this.isAnimating = false;
    }

    countConsecutiveColors(bottleIndex) {
        const bottle = this.bottles[bottleIndex];
        if (bottle.length === 0) return 0;
        
        const sourceColor = bottle[bottle.length - 1];
        let count = 0;
        
        for (let i = bottle.length - 1; i >= 0; i--) {
            if (bottle[i] === sourceColor) {
                count++;
            } else {
                break;
            }
        }
        
        return count;
    }

    async showErrorAnimation(bottle) {
        this.isAnimating = true;
        
        // Add shake class
        bottle.classList.add('shake');
        
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Remove shake class
        bottle.classList.remove('shake');
        
        this.isAnimating = false;
    }

    canPour(fromIndex, toIndex) {
        const fromBottle = this.bottles[fromIndex];
        const toBottle = this.bottles[toIndex];

        // Can't pour to the same bottle
        if (fromIndex === toIndex) return false;

        // Can't pour from empty bottle
        if (fromBottle.length === 0) return false;

        // Can pour into empty bottle
        if (toBottle.length === 0) return true;

        // Count how many consecutive same-colored segments we have at the top
        const sourceColor = fromBottle[fromBottle.length - 1];
        let consecutiveColors = 0;
        for (let i = fromBottle.length - 1; i >= 0; i--) {
            if (fromBottle[i] === sourceColor) {
                consecutiveColors++;
            } else {
                break;
            }
        }

        // Check if destination bottle has enough space and matching color
        const availableSpace = 4 - toBottle.length;
        const targetColor = toBottle[toBottle.length - 1];
        
        return sourceColor === targetColor && availableSpace > 0;
    }

    createConfetti(bottle) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        const confettiCount = 30;
        const bottleRect = bottle.getBoundingClientRect();
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${bottleRect.left + Math.random() * bottleRect.width}px`;
            confetti.style.top = `${bottleRect.top}px`;
            confetti.style.animation = `confetti-fall ${0.5 + Math.random() * 1}s linear forwards`;
            
            // Add some random rotation and movement
            const randomX = (Math.random() - 0.5) * 100;
            confetti.style.transform = `translateX(${randomX}px)`;
            
            document.body.appendChild(confetti);
            
            // Remove confetti element after animation
            setTimeout(() => {
                confetti.remove();
            }, 2000);
        }
    }

    pour(fromIndex, toIndex) {
        const fromBottle = this.bottles[fromIndex];
        const toBottle = this.bottles[toIndex];
        
        const sourceColor = fromBottle[fromBottle.length - 1];
        const availableSpace = 4 - toBottle.length;
        
        // Count consecutive same-colored segments from the top
        let consecutiveColors = 0;
        for (let i = fromBottle.length - 1; i >= 0; i--) {
            if (fromBottle[i] === sourceColor) {
                consecutiveColors++;
            } else {
                break;
            }
        }
        
        // Pour either all consecutive colors or until destination is full
        const colorsToPour = Math.min(consecutiveColors, availableSpace);
        for (let i = 0; i < colorsToPour; i++) {
            toBottle.push(fromBottle.pop());
        }

        // Check if the destination bottle is now complete
        if (this.isBottleComplete(toBottle)) {
            const bottles = document.querySelectorAll('.bottle');
            bottles[toIndex].classList.add('complete');
            this.createConfetti(bottles[toIndex]);
        }
    }

    checkWin() {
        return this.bottles.every(bottle => {
            if (bottle.length === 0) return true;
            if (bottle.length !== 4) return false;
            return bottle.every(color => color === bottle[0]);
        });
    }

    isBottleComplete(bottle) {
        return bottle.length === 4 && bottle.every(color => color === bottle[0]);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new BottleGame();
}); 

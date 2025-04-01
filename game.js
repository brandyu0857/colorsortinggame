class BottleGame {
    constructor() {
        console.log('Initializing game...');
        this.bottles = [];
        this.selectedBottle = null;
        this.colors = ['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6'];
        this.bottlesContainer = document.getElementById('bottles-container');
        this.resetButton = document.getElementById('reset-button');
        this.victoryMessage = document.getElementById('victory-message') || this.createVictoryMessage();
        this.isAnimating = false;

        this.setupEventListeners();
        this.init();
    }

    createVictoryMessage() {
        const msg = document.createElement('div');
        msg.id = 'victory-message';
        msg.className = 'victory-message';
        msg.textContent = 'Congratulations! You won!';
        this.bottlesContainer.after(msg);
        return msg;
    }

    setupEventListeners() {
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
        this.victoryMessage.classList.remove('show');
        this.selectedBottle = null;

        let isValidDistribution = false;
        while (!isValidDistribution) {
            this.bottles = Array(7).fill().map(() => []);
            let allSegments = [];

            this.colors.forEach(color => {
                allSegments.push(...Array(4).fill(color));
            });

            for (let i = allSegments.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allSegments[i], allSegments[j]] = [allSegments[j], allSegments[i]];
            }

            for (let i = 0; i < allSegments.length; i++) {
                const bottleIndex = Math.floor(i / 4);
                this.bottles[bottleIndex].push(allSegments[i]);
            }

            isValidDistribution = this.bottles.every(bottle => {
                return bottle.length === 0 || !bottle.every(color => color === bottle[0]);
            });
        }

        this.renderBottles();
    }

    renderBottles() {
        this.bottlesContainer.innerHTML = '';

        this.bottles.forEach((bottle, index) => {
            const bottleElement = document.createElement('div');
            bottleElement.className = 'bottle';
            bottleElement.dataset.index = index;

            if (this.isBottleComplete(bottle)) {
                bottleElement.classList.add('complete');
            }

            bottle.forEach((color, i) => {
                const segment = document.createElement('div');
                segment.className = 'color-segment';
                segment.style.backgroundColor = color;
                segment.style.bottom = `${i * 25}%`;
                bottleElement.appendChild(segment);
            });

            this.bottlesContainer.appendChild(bottleElement);
        });
    }

    handleBottleClick(bottleIndex) {
        if (this.isAnimating) return;

        const bottles = document.querySelectorAll('.bottle');

        if (this.selectedBottle === null) {
            if (this.bottles[bottleIndex].length > 0) {
                this.selectedBottle = bottleIndex;
                bottles[bottleIndex].classList.add('selected');
            }
        } else {
            if (this.canPour(this.selectedBottle, bottleIndex)) {
                this.animatePour(this.selectedBottle, bottleIndex);
            } else {
                const from = this.bottles[this.selectedBottle];
                const to = this.bottles[bottleIndex];

                if (
                    from.length > 0 &&
                    to.length > 0 &&
                    to.length < 4 &&
                    from[from.length - 1] !== to[to.length - 1]
                ) {
                    this.showErrorAnimation(bottles[bottleIndex]);
                }
            }

            bottles[this.selectedBottle].classList.remove('selected');
            this.selectedBottle = null;
        }
    }

    async animatePour(fromIndex, toIndex) {
        this.isAnimating = true;

        const bottles = document.querySelectorAll('.bottle');
        const fromBottle = bottles[fromIndex];
        const toBottle = bottles[toIndex];

        const fromRect = fromBottle.getBoundingClientRect();
        const toRect = toBottle.getBoundingClientRect();
        const pourDirection = fromRect.left < toRect.left ? 'right' : 'left';

        fromBottle.classList.add(`pouring-${pourDirection}`);
        toBottle.classList.add('receiving');

        await new Promise(resolve => setTimeout(resolve, 700));

        this.pour(fromIndex, toIndex);
        this.renderBottles();

        const updatedBottles = document.querySelectorAll('.bottle');
        updatedBottles[fromIndex].classList.remove(`pouring-${pourDirection}`);
        updatedBottles[toIndex].classList.remove('receiving');

        if (this.checkWin()) {
            this.victoryMessage.classList.add('show');
            setTimeout(() => this.init(), 2000);
        }

        this.isAnimating = false;
    }

    pour(fromIndex, toIndex) {
        const from = this.bottles[fromIndex];
        const to = this.bottles[toIndex];
        const color = from[from.length - 1];
        const space = 4 - to.length;

        let count = 0;
        for (let i = from.length - 1; i >= 0 && from[i] === color; i--) {
            count++;
        }

        const pourCount = Math.min(count, space);
        for (let i = 0; i < pourCount; i++) {
            to.push(from.pop());
        }

        if (this.isBottleComplete(to)) {
            const bottles = document.querySelectorAll('.bottle');
            bottles[toIndex].classList.add('complete');
            this.createConfetti(bottles[toIndex]);
        }
    }

    canPour(fromIndex, toIndex) {
        if (fromIndex === toIndex) return false;

        const from = this.bottles[fromIndex];
        const to = this.bottles[toIndex];
        if (from.length === 0) return false;
        if (to.length === 0) return true;

        const color = from[from.length - 1];
        let count = 0;
        for (let i = from.length - 1; i >= 0 && from[i] === color; i--) {
            count++;
        }

        const space = 4 - to.length;
        const targetColor = to[to.length - 1];

        return color === targetColor && space > 0;
    }

    isBottleComplete(bottle) {
        return bottle.length === 4 && bottle.every(c => c === bottle[0]);
    }

    checkWin() {
        return this.bottles.every(b => b.length === 0 || this.isBottleComplete(b));
    }

    async showErrorAnimation(bottle) {
        this.isAnimating = true;
        bottle.classList.add('shake');
        await new Promise(r => setTimeout(r, 400));
        bottle.classList.remove('shake');
        this.isAnimating = false;
    }

    createConfetti(bottle) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        const count = 30;
        const rect = bottle.getBoundingClientRect();

        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${rect.left + Math.random() * rect.width}px`;
            confetti.style.top = `${rect.top}px`;
            confetti.style.animation = `confetti-fall ${0.5 + Math.random()}s linear forwards`;
            confetti.style.transform = `translateX(${(Math.random() - 0.5) * 100}px)`;

            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 2000);
        }
    }
}

window.addEventListener('load', () => {
    new BottleGame();
});

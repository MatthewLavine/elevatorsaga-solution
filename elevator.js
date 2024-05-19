{
    init: function(elevators, floors) {
        function pickElevator() {
            for (let i = 0; i < elevators.length; i++) {
                let elevator = elevators[i];
                if (elevator.loadFactor() < 1.0) {
                    return elevator;
                }
            }
            console.log("all elevators are full, dispatching elevator 0!");
            return elevators[0];
        }

        function floorsInDirection(currentFloor, floors, direction) {
            if (direction === "up") {
                return floors.filter((f => f >= currentFloor));
            } else if (direction === "down") {
                return floors.filter((f => f <= currentFloor));
            } else {
                console.error("unexpected direction: %s", direction);
                return floors;
            }
        }

        function dispatch(floorNum) {
            dispatchElevator(pickElevator(), floorNum);
        }

        function dispatchElevator(elevator, floorNum) {
            let elevatorIndex = elevators.indexOf(elevator);
            let direction;
            if (elevator.destinationQueue.length === 0) {
                direction = "idle";
            } else if (elevator.destinationQueue[0] > elevator.currentFloor()) {
                direction = "going up";
            } else {
                direction = "going down";
            }
            console.log("[elevator %d] before dispatch: %o ; %s", elevatorIndex, elevator.destinationQueue, direction);
            if (!elevator.destinationQueue.includes(floorNum)) {
                elevator.goToFloor(floorNum);
                let direction;
                if (elevator.destinationQueue.length === 0) {
                    direction = "idle";
                } else if (elevator.destinationQueue[0] > elevator.currentFloor()) {
                    direction = "going up";
                } else {
                    direction = "going down";
                }
                console.log("[elevator %d] after dispatch: %o ; %s", elevatorIndex, elevator.destinationQueue, direction);
                if (elevator.destinationQueue[0] > elevator.currentFloor()) {
                    elevator.goingUpIndicator(true);
                    elevator.goingDownIndicator(false);
                } else {
                    elevator.goingUpIndicator(false);
                    elevator.goingDownIndicator(true);
                }
            } else {
                console.log("[elevator %d] already heading to floor %d", elevatorIndex, floorNum);
                console.log("[elevator %d] after dispatch: %o", elevatorIndex, elevator.destinationQueue);
            }
        }

        elevators.forEach((elevator, index) => {
            elevator.on("idle", function () {
                // dispatchElevator(elevator, 0);
            });

            elevator.on("stopped_at_floor", function (floorNum) {
                if (elevator.destinationQueue.length == 0) {
                    if (elevator.currentFloor() === 0) {
                        elevator.goingUpIndicator(true);
                        elevator.goingDownIndicator(false);
                    } else {
                        elevator.goingUpIndicator(true);
                        elevator.goingDownIndicator(true);
                    }
                } else {
                    if (elevator.destinationQueue[0] > floorNum) {
                        elevator.goingUpIndicator(true);
                        elevator.goingDownIndicator(false);
                    } else {
                        elevator.goingUpIndicator(false);
                        elevator.goingDownIndicator(true);
                    }
                }
            });

            elevator.on("floor_button_pressed", function (floorNum) {
                dispatchElevator(elevator, floorNum);
            });

            elevator.on("passing_floor", function (floorNum, direction) {
                console.log("passing floor: ", floorNum);
                let floors = floorsInDirection(floorNum, elevator.destinationQueue, direction);
                console.log("floors in direction: ", floors);
                if (floors.includes(floorNum)) {
                    if (elevator.destinationQueue[0] != floorNum) {
                        console.log("before interrupt: %o", elevator.destinationQueue);
                        elevator.destinationQueue.splice(elevator.destinationQueue.indexOf(floorNum), 1);
                        elevator.checkDestinationQueue();
                        elevator.goToFloor(floorNum, true);
                        console.log("after interrupt: %o", elevator.destinationQueue);
                    }
                }
            });
        });

        floors.forEach(floor => {
            floor.on("up_button_pressed", function () {
                dispatch(floor.floorNum());
            });

            floor.on("down_button_pressed", function () {
                dispatch(floor.floorNum());
            });
        });
    },
    update: function(dt, elevators, floors) { }
}
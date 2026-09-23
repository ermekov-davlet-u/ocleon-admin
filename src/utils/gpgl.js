export const GPGL = {
    unitsPerMm: 20,

    cmd(body) {
        return [...new TextEncoder().encode(body), 0x03];
    },

    initialize() {
        return [0x1b, 0x04];
    },

    statusRequest() {
        return [0x1b, 0x05];
    },

    queryVersion() {
        return this.cmd("FG");
    },

    selectTool(tool) {
        return this.cmd(`J${tool}`);
    },

    setSpeed(speed, tool = 1) {
        return this.cmd(`!${speed},${tool}`);
    },

    setForce(force, tool = 1) {
        return this.cmd(`FX${force},${tool}`);
    },

    toolUp(tool = 1) {
        return this.cmd(`FE1,${tool}`);
    },

    toolDown(tool = 1) {
        return this.cmd(`FE0,${tool}`);
    },

    moveToMm(xMm, yMm) {
        const x = Math.round(xMm * this.unitsPerMm);
        const y = Math.round(yMm * this.unitsPerMm);

        return this.cmd(`M${x},${y}`);
    },

    drawToMm(xMm, yMm) {
        const x = Math.round(xMm * this.unitsPerMm);
        const y = Math.round(yMm * this.unitsPerMm);

        return this.cmd(`D${x},${y}`);
    },

    testCutLineJob({
        lengthMm = 10,
        speed = 3,
        force = 5,
        tool = 1,
    } = {}) {
        return [
            this.initialize(),

            this.selectTool(tool),

            this.setSpeed(speed, tool),

            this.setForce(force, tool),

            this.toolUp(tool),

            this.moveToMm(0, 0),

            this.toolDown(tool),

            this.drawToMm(lengthMm, 0),

            this.toolUp(tool),
        ];
    },
};
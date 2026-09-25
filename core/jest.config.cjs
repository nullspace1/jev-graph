/** @type {import("ts-jest").JestConfigWithTsJest} */
module.exports = {
    testMatch: ["<rootDir>/test/**/*.test.ts"],
    transform: {
        "^.+\\.ts$": ["ts-jest", {
            diagnostics: false
        }]
    }
}

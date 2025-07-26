// Test script to validate ChatButton logic
const fallbackCreator = {
  id: null,
  username: null, 
  name: "John Marit",
  title: "Developer"
};

const realCreator = {
  id: 123,
  username: "johnmarit",
  name: "John Marit", 
  title: "Developer"
};

// Test the conditional logic
console.log("Testing fallback creator:");
console.log("Should show chat:", !!(fallbackCreator.id && fallbackCreator.username)); // false

console.log("\nTesting real creator:");
console.log("Should show chat:", !!(realCreator.id && realCreator.username)); // true

// This matches our conditional in Creators.js:
// {creator.id && creator.username ? <ChatButton /> : <button disabled>Chat Unavailable</button>}

import { Parse } from "parse/node";

Parse.Cloud.define("hello", (request: Parse.Cloud.FunctionRequest) => {
  return "Hello world!";
});

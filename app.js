const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();

module.exports = app;

const filePath = path.join(__dirname, "todoApplication.db");
let db = null;
app.use(express.json());

const initializerDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Error: ${e.message}`);
    process.exit(1);
  }
};
initializerDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//get API1
app.get("/todos/", async (request, response) => {
  let getTodosQuery = "";
  let data = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT * 
            FROM todo
            WHERE todo LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND status = '${status}';`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%'
                AND status = '${status}';`;
      break;

    default:
      getTodosQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//GET API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT * 
        FROM todo
        WHERE id = ${todoId};`;
  const todoItem = await db.get(getTodoQuery);
  response.send(todoItem);
});

//post add API 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
    INSERT INTO 
        todo( id,todo, priority, status )
    VALUES (
        ${id},
       '${todo}',
       '${priority}',
       '${status}'
    );`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//put API 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const previousTodoQuery = `
    SELECT * 
    FROM todo
    WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
        UPDATE todo
        SET 
            todo = '${todo}',
            priority = '${priority}',
            status ='${status}'
        WHERE 
            id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//delete API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM todo
        WHERE id = ${todoId}`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

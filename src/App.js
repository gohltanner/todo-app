import React, { useState, useRef, useEffect } from "react";
import Dexie from "dexie";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Button from "@material-ui/core/Button";
import "./App.css";
import getId from "./components/key";
import { Container } from "@material-ui/core";
import PriorityField from "./components/PriorityField";
import RevealField from "./components/RevealField";
// export { db };

//create a db
const db = new Dexie("todos");
db.version(1).stores({
  todos: "id,title,date,finished,priority,trashed,dueDate,flagged",
});

//main App function
function App() {
  const [todos, setTodos] = useState([]);
  const [tick, setTick] = useState(0);
  //const [finished, isFinished] = useState(false);
  const [lastItem, setLastItem] = useState(null);
  // const [currentTitle, setCurrentTitle] = useState(null);
  const myInput = useRef(null);
  const priRef = useRef(null);
  //const testInput = useRef(null);
  const [startDate, setStartDate] = useState(new Date());

  //loads data into table
  function loadData() {
    db.todos
      .toCollection()
      .sortBy("date")
      .then((storedTodos) => {
        setTodos(storedTodos);
      });
  }

  //side effect of app running that loads data again
  useEffect(() => {
    loadData();
    //page load every second for countdown timer
    setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);
  }, []);

  //puts individual items into table
  async function putItemIntoDatabase() {
    const id = getId(20);
    await db.todos.put({
      id: id,
      title: myInput.current.value,
      date: Date.now(),
      finished: false,
      priority: priRef.current.value,
      trashed: false,
      dueDate: startDate,
      flagged: false,
    });

    //make sure the new data is in
    loadData();

    //resets field values
    myInput.current.value = "";
    priRef.current.value = "";
    const formContainer = document.getElementById("form_container");
    formContainer.classList.toggle("hide_form");
  }

  //updates todo finished property if clicked then loads data into db
  function doneYet(id, isDone) {
    db.todos.update(id, { finished: !isDone });
    loadData();
  }

  //changes todo trashed property if clicked then loads data into db
  function trashIt(id, isTrashed) {
    db.todos.update(id, { trashed: !isTrashed });
    setLastItem(id);
    loadData();
  }

  //sets picked start date for date property
  function handleChange(date) {
    setStartDate(date);
  }

  function undoTrashed(id) {
    db.todos.update(lastItem, { trashed: false });
    loadData();
    setLastItem(null);
  }

  function timeToDueDate(dueDate) {
    let timeNow = new Date();

    let timeLeft = Math.floor((dueDate.getTime() - timeNow.getTime()) / 1000);

    //   // taken from https://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form
    //   //secondsInAYear = 31536000; secondsInADay = 86400; secondsInAnHour = 3600; secondsInAMinute = 60;

    var numhours = Math.floor(timeLeft / 3600);
    var numminutes = Math.floor((timeLeft % 3600) / 60);
    var numseconds = ((timeLeft % 86400) % 3600) % 60;
    return (
      <div className="countdown"> {numhours + ":" + numminutes + ":" + numseconds}
      </div>
    );
  }

  function priorityCheck(id, priority) {
    switch (priority) {
      case "ASAP":
        return <p className="asap">{priority}</p>;

      case "Urgent":
        return <p className="Urgent">{priority}</p>;

      case "Eh":
        return <p className="Eh">{priority}</p>;

      case "Eventually..":
        return <p className="Eventually">{priority}</p>;

      default:
        return <p className="asap">{priority}</p>;
    }
  }

  function flagCheck(flagged) {

    if (flagged === true) {
      return <span className="bigFlag">&#9873;</span>
    }
  }

  function flagged(id, isFlagged) {
    db.todos.update(id, { flagged: !isFlagged });
    loadData();
  }

  return (
    <Container id="main" className="App">
      <Container children="" id="undo_box"></Container>
      <Container children="" id="form_container">
        <PriorityField current={priRef} />
        <DatePicker selected={startDate} onChange={handleChange} />
        <input type="text" ref={myInput} placeholder="enter Todo"></input>
        <Button
          color="primary"
          variant="contained"
          onClick={putItemIntoDatabase}
        >
          add To List
        </Button>{" "}
        <br />
      </Container>
      <RevealField />
      <br />

      {lastItem && (
        <Button variant="outlined" onClick={undoTrashed}>
          undo
        </Button>
      )}
      {todos.slice(0).reverse().map((todo) => (
        <div id={getId(20)}>
          {todo.trashed ? null : (
            <div
              children=""
              key={todo.id}
              className={["todoList", todo.finished ? "finished" : null].join(
                " "
              )}
              id={todo.id}
            >
              <div >
                <br />
                <Button
                  onClick={() => { flagged(todo.id, todo.flagged) }}
                  variant="outlined"
                  color="secondary"
                  className="btns"

                >
                  &#9873;
              </Button>
                <br />
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    doneYet(todo.id, todo.finished);
                  }}
                >
                  <span>&#9989;</span>
                </Button>
                <br />
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    trashIt(todo.id, todo.trashed);
                  }}
                >
                  <span className="trashcan">&#128465;</span>
                </Button>
              </div>

              <p
                contentEditable="true"
                suppressContentEditableWarning="true"
                id={todo.id + 1}
                className="todoTitle"
              >
                {flagCheck(todo.flagged)}
                <span>{todo.title}</span>
              </p>
              <br />


              {priorityCheck(todo.id, todo.priority)}



              {timeToDueDate(todo.dueDate)}

            </div>
          )}
        </div>
      ))}
    </Container>
  );
}

export default App;

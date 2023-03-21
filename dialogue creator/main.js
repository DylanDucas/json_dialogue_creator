
var body = document.getElementById("body"),

conditions = [],

lines = {
    "0" : ["1"],
    "1" : ["0"],
},

json = [
    {"id" : "0", "type" : "message", "content" : ""},
    {"id" : "1", "type" : "placeholder"}
],

currentId = 2,

lineSvg = document.getElementById("lineSvg");

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    
    drawLine(elmnt.id)
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

dragElement(document.getElementsByClassName("blueprintBox")[0]);
dragElement(document.getElementsByClassName("blueprintBox")[1]);


function getKeyById(path, id){
    let result;
    for (let i = 0; i < eval(path).length; i++){
        try{
            if (eval(path + `[${i}]["id"]`) == id && eval(path + `[${i}]["id"]`) != undefined) return [path,i];
            if (Array.isArray(eval(path + `[${i}]["content"]`))){
                result = getKeyById(path + `[${i}]["content"]`,id);
                if (!!result) return result;
            }
        }catch(err){}
    }
    return false;
}

function drawLine(id){
    let div1 = document.getElementById(id),
    div2, line, lineId;
    for (let i = 0; i < lines[id].length; i++){
        div2 = document.getElementById(lines[id][i]);
        lineId = id + "_line_" + lines[id][i];
        line = document.getElementById(lineId);

        if (!line){
            let newLine = document.createElement("line");
            newLine.id = lineId;
            lineSvg.appendChild(newLine);
            line = document.getElementById(lineId);
        }

        if (!div2){
            try{
                line.remove();
                lineId =  lines[id][i] + "_line_" + id;
                line = document.getElementById(lineId);
                line.remove();
                lines[id].splice(i,1);
                i--;
            }catch(err){}

            continue;
        }
        

        let x1 = +div1.style.left.slice(0, -2) + +div1.style.width.slice(0, -2) / 2,
        x2 = +div2.style.left.slice(0, -2) + +div2.style.width.slice(0, -2) / 2,
        y1 = +div1.style.top.slice(0, -2) + +div1.style.height.slice(0, -2) / 2,
        y2 = +div2.style.top.slice(0, -2) + +div2.style.height.slice(0, -2) / 2;

        line.outerHTML = `<line id="${lineId}" stroke="black" 
        x1="${x1}" y1="${y1}"
        x2="${x2}" y2="${y2}"></line>`;

        lineId = lines[id][i] + "_line_" + id;
        line = document.getElementById(lineId);

        if (!line){
            let newLine = document.createElement("line");
            newLine.id = lineId;
            lineSvg.appendChild(newLine);
            line = document.getElementById(lineId);
        }



        line.outerHTML = `<line id="${lineId}" stroke="black" 
        x1="${x1}" y1="${y1}"
        x2="${x2}" y2="${y2}"></line>`;

    }
}

drawLine(0);

function createBox(element){
    element = document.getElementById(element.parentElement.parentElement.id);
    element.name = "";
    element.innerHTML = `
    <div class="blueprintHeader row header" id="${element.id}header" style="background-color: aqua;">
        <select oninput="changeBoxType(this);">
            <option value="message" selected>Message</option>
            <option value="choice">Choice</option>
            <option value="script">Script</option>
            <option value="condition">Condition</option>
            <option value="awaitEnter">Await Enter</option>
            <option value="moveTo">Move to</option>
            <option value="end">End</option>
        </select>
        Id: ${element.id}
        <button onclick="deleteBox(this);">X</button>
    </div>
    <div style="background-color: bisque;" class="row content" style="height: 70%;">
        <textarea oninput="updateContent(this);"></textarea>
    </div>
    `;
    dragElement(element);
    newBox = document.createElement("div");
    newBox.className = "blueprintBox box line";
    newBox.id = currentId;
    newBox.style = `width: 200px;height: 200px;left:${+element.style.left.slice(0, -2) + 225}px;top:${element.style.top};`;
    newBox.name = "noDelete";
    newBox.innerHTML = `
        <div class="box header" id="${currentId}header" style="background-color: bisque;height:30%">

        </div>
        <div style="background-color: bisque;" class="row content" style="height: 70%;">
            <button onclick="createBox(this);">+</button>
        </div>
    `;
    body.appendChild(newBox);

    lines[newBox.id] = [];
    lines[element.id].push(newBox.id);
    lines[newBox.id].push(element.id);
    dragElement(newBox);
    drawLine(newBox.id);
    drawLine(element.id);
    key = getKeyById(`json`,element.id);
    eval(key[0] + "["+key[1]+`] = ${JSON.stringify({"id" : element.id, "type" : "message", "content" : ""})}`);
    eval(key[0] + "["+(key[1] + 1)+`] = ${JSON.stringify({"id" : currentId, "type" : "placeholder"})}`);
    observer.observe(newBox, config);
    currentId++;
}

var MutationObserver = window.MutationObserver;

var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      drawLine(mutation.target.id);
    });    
  });

var target = document.getElementsByClassName("line");

var config = { attributes: true, attributeOldValue: true }

observer.observe(target[0], config);
observer.observe(target[1], config);

function createChoice(element){
    box = element.parentElement.parentElement;

    key = getKeyById(`json`,box.id);
    if (!eval(key[0] + '['+key[1]+']["content"]'))eval(key[0] + '['+key[1]+']["content"] = []');
    eval(key[0] + `[${key[1]}]["content"]`).push({"id" : currentId, "type" : "choiceOption", "content" : []});

    let newBox = document.createElement("div");
    newBox.className = "blueprintBox box line";
    newBox.name = "";
    newBox.id = currentId;
    newBox.style = `width: 200px;height: 200px;top:${+box.style.top.slice(0, -2) + 225}px;left:${box.style.left};`;
    newBox.innerHTML = `
        <div class="blueprintHeader row header" id="${currentId}header" style="background-color: violet;">
            Choice option ${getKeyById(`json`,currentId)[1] + 1}
            <button onclick="deleteBox(this);">X</button>
        </div>
        <div style="background-color: bisque;" class="row content" style="height: 70%;">
            <textarea oninput="updateContent(this);"></textarea>
        </div>
    `;
    body.appendChild(newBox);
    
    lines[newBox.id] = [];
    lines[box.id].push(newBox.id);
    lines[newBox.id].push(box.id);
    dragElement(newBox);
    drawLine(newBox.id);
    drawLine(box.id);
    observer.observe(newBox, config);
    currentId++;

    let newBox2 = document.createElement("div");
    newBox2.className = "blueprintBox box line";
    newBox2.id = currentId;
    newBox2.name = "";
    newBox2.style = `width: 200px;height: 200px;top:${+newBox.style.top.slice(0, -2) + 225}px;left:${newBox.style.left};`;
    newBox2.innerHTML = `
        <div class="blueprintHeader row header" id="${currentId}header" style="background-color: aqua;">
            <select oninput="changeBoxType(this);">
                <option value="message" selected>Message</option>
                <option value="choice">Choice</option>
                <option value="script">Script</option>
                <option value="condition">Condition</option>
                <option value="awaitEnter">Await Enter</option>
                <option value="moveTo">Move to</option>
                <option value="end">End</option>
            </select>
            Id: ${currentId}
            <button onclick="deleteBox(this);">X</button>
        </div>
        <div style="background-color: bisque;" class="row content" style="height: 70%;">
            <textarea oninput="updateContent(this);"></textarea>
        </div>
    `;
    body.appendChild(newBox2);

    the_length = eval(key[0] + '['+key[1]+']["content"].length') - 1;
    
    lines[newBox2.id] = [];
    lines[newBox.id].push(newBox2.id);
    lines[newBox2.id].push(newBox.id);
    dragElement(newBox2);
    drawLine(newBox2.id);
    drawLine(newBox.id);
    key = getKeyById(`json`,newBox.id);
    eval(key[0] + `[${key[1]}]["content"]`).push({"id" : currentId, "type" : "message", "content" : ""});
    observer.observe(newBox2, config);
    currentId++;


    let newBox3 = document.createElement("div");
    newBox3.className = "blueprintBox box line";
    newBox3.style = `width: 200px;height: 200px;top:${+newBox2.style.top.slice(0, -2) + 225}px;left:${newBox2.style.left};`;
    newBox3.id = currentId;
    newBox3.name = "noDelete";
    newBox3.innerHTML = `
        <div class="box header" id="${currentId}header" style="height: 30%;background-color: bisque;">

        </div>
        <div style="background-color: bisque;" class="row content" style="height: 70%;">
            <button onclick="createBox(this);">+</button>
        </div>
    `;
    body.appendChild(newBox3);

    eval(key[0] + `[${key[1]}]["content"]`).push({"id" : currentId, "type" : "placeholder"});
    
    lines[newBox3.id] = [];
    lines[newBox2.id].push(newBox3.id);
    lines[newBox3.id].push(newBox2.id);
    dragElement(newBox3);
    drawLine(newBox3.id);
    drawLine(newBox2.id);
    observer.observe(newBox3, config);
    currentId++;
}

function changeBoxType(element){
    box = element.parentElement.parentElement;
    header = element.parentElement;
    content = element.parentElement.nextElementSibling;
    key = getKeyById('json', box.id);
    eval(key[0] + `[${key[1]}]["content"] = ""`);
    switch(element.value){
        case "message":
            header.style.backgroundColor = "aqua";
            content.innerHTML = `<textarea oninput="updateContent(this);"></textarea>`;
            break;
        case "choice":
            header.style.backgroundColor = "purple";
            content.innerHTML = `<textarea oninput="updateContent(this);"></textarea><button onclick="createChoice(this);">+</button>`;
            eval(key[0] + `[${key[1]}]["content"] = []`);
            break;
        case "script":
            header.style.backgroundColor = "orange";
            content.innerHTML = `<textarea oninput="updateContent(this);"></textarea>`;
            break;
        case "condition":
            header.style.backgroundColor = "pink";
            content.innerHTML = `<textarea oninput="updateContent(this);"></textarea>`;
            eval(key[0] + `[${key[1]}]["content"] = []`);
            createCondition(box);
            break;
        case "awaitEnter":
            header.style.backgroundColor = "blue";
            content.innerHTML = ``;
            break;
        case "moveTo":
            header.style.backgroundColor = "greenyellow";
            content.innerHTML = `<input type="number" oninput="updateContent(this);"></input>`;
            break;
        case "end":
            header.style.backgroundColor = "red";
            content.innerHTML = ``;
            break;
    }
    eval(key[0] + `[${key[1]}]["type"] = "${element.value}"`);
    removeBoxWithoutJson();
}

const ignoreUpdate = ["choice","choiceOption","condition"],

useDisplay = ["choice","choiceOption"];

function updateContent(element){
    box = element.parentElement.parentElement;
    key = getKeyById('json', box.id);
    if (!ignoreUpdate.includes(eval(key[0]+"["+key[1]+`]["type"]`)))
        eval(key[0]+"["+key[1]+`]["content"] = `+`"`+element.value+`"`);
    else if(useDisplay.includes(eval(key[0]+"["+key[1]+`]["type"]`)))
        eval(key[0]+"["+key[1]+`]["display"] = `+`"`+element.value+`"`);
    else eval(key[0]+"["+key[1]+`]["condition"] = `+`"`+element.value+`"`);
}

function deleteInvalidLines(){
    for (let i = 0; i < currentId; i++)
        for (let p = 0; p < currentId; p++)
            if (document.getElementById(i+"_line_"+p) && (!document.getElementById(`${i}`) || !document.getElementById(`${p}`)))
                document.getElementById(i+"_line_"+p).remove();
}

function deleteBox(element){
    box = element.parentElement.parentElement;

    key = getKeyById('json',box.id);

    let oldPath = key[0],
    oldPlace = key[1];

    if (eval(key[0]+"["+key[1]+`]["type"]`) != "choiceOption"){
        eval(key[0]+"["+key[1]+`] = ${JSON.stringify({"id" : box.id, "type" : "placeholder"})}`);
        box.innerHTML = `
        <div class="box header" id="${box.id}header" style="height: 30%;background-color: bisque;">
    
        </div>
        <div style="background-color: bisque;" class="row content" style="height: 70%;">
            <button onclick="createBox(this);">+</button>
        </div>
        `;
        box.name = "noDelete";
        dragElement(box);
    }
    else eval("delete "+key[0]+"["+key[1]+`]`);


    for (let i = 0; i < currentId; i++){
        key = getKeyById('json', i);
        
        if ((key[0] == oldPath && +oldPlace < +key[1]) && eval(key[0]+"["+key[1]+`]["type"]`) != "choiceOption"){
            eval("delete "+key[0]+"["+key[1]+"]");
        }
            
    }
        
    removeBoxWithoutJson();
}

function removeBoxWithoutJson(){
    for (let i = 0; i < currentId; i++)
        if (!getKeyById('json',i)) try{if 
        ((!document.getElementById(`${i}`).name.includes("noDelete") 
        || (!document.getElementById(`${i - 1}`) || document.getElementById(`${i - 1}`).name.includes("noDelete")))
        )document.getElementById(`${i}`).outerHTML = ""}catch(err){};
    deleteInvalidLines();
}

function download(fileName){
    var a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([JSON.stringify(json)], {type: 'text/plain'}));
    a.download = `dialogue_${fileName}.json`;
    body.appendChild(a);
    a.click();
    body.removeChild(a);
}

function createCondition(conditionBox){
    let newBox = document.createElement("div");
    newBox.className = "blueprintBox box line";
    newBox.id = currentId;
    newBox.name = "";
    newBox.style = `width: 200px;height: 200px;top:${+conditionBox.style.top.slice(0, -2) + 225}px;left:${conditionBox.style.left};`;
    newBox.innerHTML = `
        <div class="blueprintHeader row header" id="${currentId}header" style="background-color: aqua;">
            <select oninput="changeBoxType(this);">
                <option value="message" selected>Message</option>
                <option value="choice">Choice</option>
                <option value="script">Script</option>
                <option value="condition">Condition</option>
                <option value="awaitEnter">Await Enter</option>
                <option value="moveTo">Move to</option>
                <option value="end">End</option>
            </select>
            Id: ${currentId}
            <button onclick="deleteBox(this);">X</button>
        </div>
        <div style="background-color: bisque;" class="row content" style="height: 70%;">
            <textarea oninput="updateContent(this);"></textarea>
        </div>
    `;
    body.appendChild(newBox);

    key = getKeyById(`json`,conditionBox.id);

    the_length = eval(key[0] + '['+key[1]+']["content"].length') - 1;
    
    lines[newBox.id] = [];
    lines[conditionBox.id].push(newBox.id);
    lines[newBox.id].push(conditionBox.id);
    dragElement(newBox);
    drawLine(newBox.id);
    drawLine(conditionBox.id);
    eval(key[0] + `[${key[1]}]["content"]`).push({"id" : currentId, "type" : "message", "content" : ""});
    observer.observe(newBox, config);
    currentId++;


    let newBox2 = document.createElement("div");
    newBox2.className = "blueprintBox box line";
    newBox2.style = `width: 200px;height: 200px;top:${+newBox.style.top.slice(0, -2) + 225}px;left:${conditionBox.style.left};`;
    newBox2.id = currentId;
    newBox2.name = "noDelete";
    newBox2.innerHTML = `
        <div class="box header" id="${currentId}header" style="height: 30%;background-color: bisque;">

        </div>
        <div style="background-color: bisque;" class="row content" style="height: 70%;">
            <button onclick="createBox(this);">+</button>
        </div>
    `;
    body.appendChild(newBox2);

    eval(key[0] + `[${key[1]}]["content"]`).push({"id" : currentId, "type" : "placeholder"});
    
    lines[newBox2.id] = [];
    lines[newBox.id].push(newBox2.id);
    lines[newBox2.id].push(newBox.id);
    dragElement(newBox2);
    drawLine(newBox2.id);
    drawLine(newBox.id);
    observer.observe(newBox2, config);
    currentId++;
}

const noSaveContent = ["end","awaitEnter","placeholder"];

function loadBlueprint(){
    let input = document.createElement('input');
    input.type = 'file';
    input.oninput = function(){loadBlueprintNext(input);}
    input.click();
}

function loadBlueprintNext(input){
    let fr = new FileReader();

    fr.onload = () => {
        [body.innerHTML,json,lines,currentId] = JSON.parse(fr.result);

        input.files[0] = null;
        for (let i = 0; i < currentId; i++)
            if (document.getElementById(i)){
                key = getKeyById("json",i);
                if(document.getElementById(i+"header").firstElementChild)
                    document.getElementById(i+"header").firstElementChild.value = eval(key[0]+"["+key[1]+']["type"]');
                dragElement(document.getElementById(i));
                if (!noSaveContent.includes(eval(key[0]+"["+key[1]+']["type"]'))){
                    element = document.getElementById(i).firstElementChild.nextElementSibling.firstElementChild;
                    if (eval(key[0]+"["+key[1]+']["display"]') != undefined)
                        element.innerHTML = eval(key[0]+"["+key[1]+']["display"]');
                    else if (eval(key[0]+"["+key[1]+']["condition"]') != undefined)
                        element.innerHTML = eval(key[0]+"["+key[1]+']["condition"]');
                    else element.innerHTML = eval(key[0]+"["+key[1]+']["content"]');
                }
            }
        lineSvg = document.getElementById("lineSvg");
    }

    fr.readAsText(input.files[0]);
}

function downloadBlueprint(fileName){
    var a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([JSON.stringify([body.innerHTML,json,lines,currentId])], {type: 'text/plain'}));
    a.download = `dialogue_blueprint_${fileName}.json`;
    body.appendChild(a);
    a.click();
    body.removeChild(a);
}

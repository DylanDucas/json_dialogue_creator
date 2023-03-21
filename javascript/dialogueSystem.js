function awaitEnter() {
    return new Promise((resolve) => {
        function checkPressA(){
            try{
                if (gp.buttons[0].pressed){
                    document.removeEventListener('keydown', onKeyHandler);
                    continuePressA = false;
                    waitForCondition("!gp.buttons[0].pressed", resolve);
                }
            }catch(err){}
        
            if(continuePressA)window.requestAnimationFrame(checkPressA);
        }

        continuePressA = true;
        window.requestAnimationFrame(function(){checkPressA(resolve);});
        document.addEventListener('keydown', onKeyHandler);
        function onKeyHandler(e) {
            if (writingText) return;
            if (keys[13]) {
                document.removeEventListener('keydown', onKeyHandler);
                continuePressA = false;
                waitForCondition("!keys[13]", resolve);
            }
        }
    });
}

var continuePressA;



function startDialogue(dialogue){
    if (dialogues[dialogue] == null) return;
    runGame = false;
    advancingTime = false;

    dialogueHud.hidden = false;
    currentDialogue = dialogue;
    dialogueInterpretor(`dialogues["${dialogue}"]`);
}

async function typeWriter(txt,i) {
    if (disableTypeWriting || dialogueBox.innerHTML == "")return;
    if (!writingText){
        i = 0;
        dialogueBox.innerHTML = "";
        writingText = true;
    }
    if (keys[32] || keys[13]) skipDialogue = true;
    else try{if (gp.buttons[0].pressed){skipDialogue = true;while(gp.buttons[0].pressed){gp = navigator.getGamepads()[0];}}}catch(err){}
    if (i < txt.length && !skipDialogue) {
        dialogueBox.innerHTML += txt.charAt(i);
        i++;
        setTimeout(function(){typeWriter(txt,i);}, textSpeed);
    }
    else if (i != undefined){
        dialogueBox.innerHTML = txt + "<blink>\u27A2</blink>";
        skipDialogue = false;
        writingText = false;
    }
}

async function dialogueInterpretor(dialogueLine){
    let breakDialogue = false;
    for (let i = 0; i < eval(dialogueLine).length && !breakDialogue; i++)
        switch(eval(dialogueLine + `[${i}]["type"]`)){
            case "message":
                dialogueBox.innerHTML = eval(dialogueLine + `[${i}]["content"]`);
                await awaitEnter();
                break;
            case "choice":
                dialogueBox.innerHTML = eval(dialogueLine + `[${i}]["display"]`);
                inDialogueChoice = true;
                indexChoice = 0;
                for (let p = 0; p < eval(dialogueLine + `[${i}]["content"]`).length; p++){
                    let newButton = document.createElement("button");
                    newButton.onclick = () => {inDialogueChoice = false;try{if (gp.buttons[0].pressed){while(gp.buttons[0].pressed){gp = navigator.getGamepads()[0];}}}catch(err){}dialogueButton.innerHTML = "";dialogueInterpretor(dialogueLine + `[${i}]["content"][${p}]["content"]`);}
                    newButton.innerHTML = eval(dialogueLine + `[${i}]["content"][${p}]["display"]`);
                    newButton.classList.add('dialogueButton');
                    dialogueButton.appendChild(newButton);
                }
                dialogueChoices = dialogueButton.getElementsByTagName("button");
                dialogueChoices[0].classList.add("activeButton");
                breakDialogue = true;
                break;
            case "awaitEnter":
                await awaitEnter();
                break;
            case "script":
                eval(eval(dialogueLine + `[${i}]["content"]`));
                break;
            case "condition":
                if (eval(eval(dialogueLine + `[${i}]["condition"]`))){
                    dialogueInterpretor(dialogueLine + `[${i}]["content"]`);
                    breakDialogue = true;
                }
                break;
            case "moveTo":
                let result = getKeyById(`dialogues["${currentDialogue}"]`,eval(eval(dialogueLine + `[${i}]["content"]`)));
                if (!!result) {
                    dialogueLine = result[0];
                    i = result[1] - 1;
                }
                break;
            case "end":
                runGame = true;
                advancingTime = true;
                breakDialogue = true;
                dialogueHud.hidden = true;
                break;
        }
}

function getKeyById(path, id){
    let result;
    for (let i = 0; i < eval(path).length; i++){
        try{
            if (eval(path + `[${i}]["id"]`) == id) return [path,i];
            if (Array.isArray(eval(path + `[${i}]["content"]`))){
                result = getKeyById(path + `[${i}]["content"]`,id);
                if (!!result) return result;
            }
        }catch(err){}
    }
    return false;
}
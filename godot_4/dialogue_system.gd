extends Control

var dialogue_menu

var txt_box

var button_box

var in_dialogue = false

var break_dialogue = false

var current_dialogue

var selected_button

var check_button

var in_choice

var player

const dialogues = {
	"test" : [{"id":"0","type":"message","content":"This is a dialogue i created using my dialogue creator!"},{"id":"1","type":"choice","content":[{"id":3,"type":"choiceOption","content":[{"id":4,"type":"message","content":"Here is gold for you!"},{"id":"5","type":"script","content":"gold += 50;"},{"id":"6","type":"end","content":""},{"id":7,"type":"placeholder"}],"display":"It's cool!"},{"id":8,"type":"choiceOption","content":[{"id":9,"type":"message","content":"I will hurt you :)"},{"id":"10","type":"script","content":"player.health += -50;"},{"id":"11","type":"end","content":""},{"id":12,"type":"placeholder"}],"display":"It's shit!"}],"display":"What do you think of it?"},{"id":2,"type":"placeholder"}],
}

func _ready():
	set_process_input(true) 
	add_user_signal("continue_dialogue")
	self.process_mode = Control.PROCESS_MODE_ALWAYS

func _input(ev):
	if not in_dialogue:
		return
	if ev.is_action_released("ui_accept"): 
		emit_signal("continue_dialogue")
		if in_choice:
			if range(button_box.get_children().size()).has(selected_button):
				if button_box.get_children()[selected_button].has_focus():
					button_box.get_children()[selected_button].emit_signal("pressed")
	if ev.is_action_released("ui_down"):
		if range(button_box.get_children().size()).has(selected_button + 1):
			selected_button += 1
			button_box.get_children()[selected_button].grab_focus()
	else: 
		if ev.is_action_released("ui_up"):
			if range(button_box.get_children().size()).has(selected_button - 1):
				selected_button -= 1
				button_box.get_children()[selected_button].grab_focus()

func evaluate(input):
	var script = GDScript.new()
	script.set_source_code("func eval():\n\treturn " + input)
	script.reload()

	var obj = RefCounted.new()
	obj.set_script(script)

	return obj.eval()

func get_key_by_id(path, id):
	var result
	for i in path.size():
		if int(path[i]["id"]) == int(id):
			return [path,i]
		if path[i].has('content'):
			if typeof(path[i]["content"]) == 19:
				result = get_key_by_id(path[i]["content"], id)
				if result:
					return result
	return false

func start_dialogue(dialogueName):
	player = get_node("/root/world").find_child("player")
	dialogue_menu = player.find_child("dialogue_menu")
	txt_box = dialogue_menu.find_child("txt_box")
	button_box = dialogue_menu.find_child("dialogue_button_box")
	dialogue_menu.visible = true
	in_dialogue = true
	if not dialogues[dialogueName]: return
	current_dialogue = dialogueName
	get_tree().paused = true
	dialogue_interpretor(dialogues[dialogueName])

func dialogue_interpretor(txt):
	break_dialogue = false
	var i = 0
	var increment_i
	selected_button = 0
	for n in button_box.get_children():
		button_box.remove_child(n)
	while i != txt.size():
		increment_i = true
		in_choice = false
		match(txt[i]["type"]):
			"message":
				txt_box.text = txt[i]["content"]
				await self.continue_dialogue
			"choice":
				txt_box.text = txt[i]["display"]
				in_choice = true
				for p in txt[i]["content"].size():
					var new_button = TextureButton.new()
					new_button.expand = true
					new_button.texture_normal = load('res://img/UI/button.png')
					new_button.texture_hover = load('res://img/UI/button_pressed.png')
					new_button.texture_focused = load('res://img/UI/button_pressed.png')
					new_button.connect("pressed",Callable(self,"dialogue_interpretor").bind(txt[i]["content"][p]["content"]))
					new_button.custom_minimum_size = Vector2(50,25)
					button_box.add_child(new_button)
					
					var new_label = Label.new()
					new_label.text = txt[i]["content"][p]["display"]
					new_button.add_child(new_label)
					new_label.position = Vector2(new_button.get_size().x / 2 - new_label.get_size().x / 2, new_button.get_size().y / 2 - new_label.get_size().y / 2)
				break_dialogue = true
			"awaitEnter":
				await self.continue_dialogue
			"script":
				evaluate(txt[i]["content"])
			"condition":
				if evaluate(txt[i]["condition"]):
					txt = txt[i]["content"]
					i = 0
					increment_i = false
			"moveTo":
				var result
				result = get_key_by_id(dialogues[current_dialogue], txt[i]["content"])
				txt = result[0]
				i = result[1]
				increment_i = false
			"end":
				dialogue_menu.visible = false
				in_dialogue = false
				get_tree().paused = false
		if break_dialogue:
			break
		if increment_i:
			i += 1

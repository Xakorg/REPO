import * as Blockly from 'blockly/core';

export const setupXakteirBlocks = () => {
  // 1. TRIGGERS (Events) - Yellow: 60
  Blockly.Blocks['xakteir_on_start'] = {
    init: function () {
      this.appendDummyInput()
          .appendField("When game starts");
      this.setNextStatement(true, null);
      this.setColour(60);
      this.setTooltip("Runs when the game starts.");
    }
  };

  Blockly.Blocks['xakteir_on_key'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("When key")
          .appendField(new Blockly.FieldDropdown([
            ["Space", "Space"],
            ["Up Arrow", "ArrowUp"],
            ["Down Arrow", "ArrowDown"],
            ["Left Arrow", "ArrowLeft"],
            ["Right Arrow", "ArrowRight"],
            ["W", "w"], ["A", "a"], ["S", "s"], ["D", "d"]
          ]), "KEY")
          .appendField("is pressed");
      this.setNextStatement(true, null);
      this.setColour(60);
      this.setTooltip("Runs when a specific key is pressed.");
    }
  };

  // 2. MOVEMENT - Blue: 230
  Blockly.Blocks['xakteir_move'] = {
    init: function () {
      this.appendValueInput("STEPS")
          .setCheck("Number")
          .appendField("Move");
      this.appendDummyInput()
          .appendField("steps forward");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("Moves the object forward by the specified steps.");
    }
  };

  Blockly.Blocks['xakteir_go_to'] = {
    init: function() {
      this.appendValueInput("X")
          .setCheck("Number")
          .appendField("Go to x:");
      this.appendValueInput("Y")
          .setCheck("Number")
          .appendField("y:");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("Teleport to exact coordinates.");
    }
  };

  Blockly.Blocks['xakteir_set_gravity'] = {
    init: function() {
      this.appendValueInput("GRAVITY")
          .setCheck("Number")
          .appendField("Set gravity to");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("Applies gravity to the game world.");
    }
  };

  // 3. VISUALS - Purple: 290
  Blockly.Blocks['xakteir_say'] = {
    init: function() {
      this.appendValueInput("TEXT")
          .setCheck("String")
          .appendField("Say");
      this.appendValueInput("TIME")
          .setCheck("Number")
          .appendField("for");
      this.appendDummyInput()
          .appendField("seconds");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("Displays a text bubble above the object.");
    }
  };

  Blockly.Blocks['xakteir_hide'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Hide object");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("Hides the object.");
    }
  };

  Blockly.Blocks['xakteir_show'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Show object");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("Shows the object.");
    }
  };

  // 4. SUPERPOWERS - Teal: 180
  Blockly.Blocks['xakteir_speak'] = {
    init: function() {
      this.appendValueInput("TEXT")
          .setCheck("String")
          .appendField("Make computer speak");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(180);
      this.setTooltip("Uses text-to-speech to speak the text.");
    }
  };

  Blockly.Blocks['xakteir_vibrate'] = {
    init: function() {
      this.appendValueInput("TIME")
          .setCheck("Number")
          .appendField("Vibrate device for");
      this.appendDummyInput()
          .appendField("seconds");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(180);
      this.setTooltip("Vibrates the mobile device if supported.");
    }
  };

  // 5. WORLD - Green: 120
  Blockly.Blocks['xakteir_spawn'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Spawn new")
          .appendField(new Blockly.FieldTextInput("Coin"), "OBJECT");
      this.appendValueInput("X")
          .setCheck("Number")
          .appendField("at x:");
      this.appendValueInput("Y")
          .setCheck("Number")
          .appendField("y:");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("Spawns a new object at the specified coordinates.");
    }
  };

  Blockly.Blocks['xakteir_destroy'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Destroy this object");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("Destroys the current object.");
    }
  };
};

export const xakteirToolboxConfig = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Triggers",
      colour: "60",
      contents: [
        { kind: "block", type: "xakteir_on_start" },
        { kind: "block", type: "xakteir_on_key" }
      ]
    },
    {
      kind: "category",
      name: "Movement",
      colour: "230",
      contents: [
        { kind: "block", type: "xakteir_move" },
        { kind: "block", type: "xakteir_go_to" },
        { kind: "block", type: "xakteir_set_gravity" }
      ]
    },
    {
      kind: "category",
      name: "Visuals",
      colour: "290",
      contents: [
        { kind: "block", type: "xakteir_say" },
        { kind: "block", type: "xakteir_show" },
        { kind: "block", type: "xakteir_hide" }
      ]
    },
    {
      kind: "category",
      name: "World",
      colour: "120",
      contents: [
        { kind: "block", type: "xakteir_spawn" },
        { kind: "block", type: "xakteir_destroy" }
      ]
    },
    {
      kind: "category",
      name: "Superpowers",
      colour: "180",
      contents: [
        { kind: "block", type: "xakteir_speak" },
        { kind: "block", type: "xakteir_vibrate" }
      ]
    },
    {
      kind: "sep"
    },
    {
      kind: "category",
      name: "Logic",
      colour: "210",
      contents: [
        { kind: "block", type: "controls_if" },
        { kind: "block", type: "controls_repeat_ext" },
        { kind: "block", type: "logic_compare" },
        { kind: "block", type: "logic_operation" },
        { kind: "block", type: "logic_boolean" }
      ]
    },
    {
      kind: "category",
      name: "Math",
      colour: "230",
      contents: [
        { kind: "block", type: "math_number" },
        { kind: "block", type: "math_arithmetic" },
        { kind: "block", type: "math_random_int" }
      ]
    },
    {
      kind: "category",
      name: "Memory",
      colour: "330",
      custom: "VARIABLE"
    }
  ]
};

import * as Blockly from 'blockly/core';
import 'blockly/javascript';

// Note: Blockly.JavaScript is available if 'blockly/javascript' is imported,
// but in newer Blockly versions it might be accessed via a named export.
// We'll use the robust way based on typical Blockly v10+ setup.
import { javascriptGenerator } from 'blockly/javascript';

export const setupXakteirGenerator = () => {
  // 1. TRIGGERS
  javascriptGenerator.forBlock['xakteir_on_start'] = function(block, generator) {
    const statements = generator.statementToCode(block, 'NEXT');
    return `Xakteir.onStart(function() {\n${statements}});\n`;
  };

  javascriptGenerator.forBlock['xakteir_on_key'] = function(block, generator) {
    const key = block.getFieldValue('KEY');
    const statements = generator.statementToCode(block, 'NEXT');
    return `Xakteir.onKeyPress('${key}', function() {\n${statements}});\n`;
  };

  // 2. MOVEMENT
  javascriptGenerator.forBlock['xakteir_move'] = function(block, generator) {
    const steps = generator.valueToCode(block, 'STEPS', (javascriptGenerator as any).ORDER_ATOMIC || 0) || '0';
    return `Xakteir.moveForward(${steps});\n`;
  };

  javascriptGenerator.forBlock['xakteir_go_to'] = function(block, generator) {
    const x = generator.valueToCode(block, 'X', (javascriptGenerator as any).ORDER_ATOMIC || 0) || '0';
    const y = generator.valueToCode(block, 'Y', (javascriptGenerator as any).ORDER_ATOMIC || 0) || '0';
    return `Xakteir.goTo(${x}, ${y});\n`;
  };

  javascriptGenerator.forBlock['xakteir_set_gravity'] = function(block, generator) {
    const gravity = generator.valueToCode(block, 'GRAVITY', (javascriptGenerator as any).ORDER_ATOMIC || 0) || '0';
    return `Xakteir.setGravity(${gravity});\n`;
  };

  // 3. VISUALS
  javascriptGenerator.forBlock['xakteir_say'] = function(block, generator) {
    const text = generator.valueToCode(block, 'TEXT', (javascriptGenerator as any).ORDER_ATOMIC || 0) || '""';
    const time = generator.valueToCode(block, 'TIME', (javascriptGenerator as any).ORDER_ATOMIC || 0) || '0';
    return `Xakteir.say(${text}, ${time});\n`;
  };

  javascriptGenerator.forBlock['xakteir_hide'] = function() {
    return `Xakteir.hide();\n`;
  };

  javascriptGenerator.forBlock['xakteir_show'] = function() {
    return `Xakteir.show();\n`;
  };

  // 4. SUPERPOWERS
  javascriptGenerator.forBlock['xakteir_speak'] = function(block, generator) {
    const text = generator.valueToCode(block, 'TEXT', (javascriptGenerator as any).ORDER_ATOMIC || 0) || '""';
    return `Xakteir.speak(${text});\n`;
  };

  javascriptGenerator.forBlock['xakteir_vibrate'] = function(block, generator) {
    const time = generator.valueToCode(block, 'TIME', (javascriptGenerator as any).ORDER_ATOMIC || 0) || '0';
    return `Xakteir.vibrate(${time});\n`;
  };

  // 5. WORLD
  javascriptGenerator.forBlock['xakteir_spawn'] = function(block, generator) {
    const object = block.getFieldValue('OBJECT');
    const x = generator.valueToCode(block, 'X', (javascriptGenerator as any).ORDER_ATOMIC || 0) || '0';
    const y = generator.valueToCode(block, 'Y', (javascriptGenerator as any).ORDER_ATOMIC || 0) || '0';
    return `Xakteir.spawn('${object}', ${x}, ${y});\n`;
  };

  javascriptGenerator.forBlock['xakteir_destroy'] = function() {
    return `Xakteir.destroy();\n`;
  };
};

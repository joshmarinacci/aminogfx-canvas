var canvas = require('./canvasamino.js');
var amino_core = require('aminogfx');

exports.input = amino_core.input;
exports.start = amino_core.start;
exports.makeProps = amino_core.makeProps;

exports.Group = amino_core.Group;
exports.Circle = amino_core.Circle;
exports.Rect = amino_core.Rect;
exports.Text = amino_core.Text;
exports.ImageView = amino_core.ImageView;

var OS = "BROWSER";
exports.input.init(OS);
exports.setCanvas = canvas.setCanvas;
//exports.ConstraintSolver = require('./src/ConstraintSolver');

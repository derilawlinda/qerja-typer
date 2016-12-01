var start = 0;
var playing = null;
var started = false;
var play;
var words;

var Word = Backbone.Model.extend({
	move: function() {
		this.set({y:this.get('y') + this.get('speed')});
	}
});

var Words = Backbone.Collection.extend({
	model:Word
});

var WordView = Backbone.View.extend({
	initialize: function() {
		//Solved masalah nomor 5 (kata2 terbentur apabila browser dikecilkan)
		$(this.el).css({position:'absolute', "min-width":"10000px", width: "10000px",overflow: "hidden"}); 
		var string = this.model.get('string');
		var letter_width = 25;
		var word_width = string.length * letter_width;
		if(this.model.get('x') + word_width > $(window).width()) {
			this.model.set({x:$(window).width() - word_width});
		}
		for(var i = 0;i < string.length;i++) {
			$(this.el)
				.append($('<div>')
					.css({
						width:letter_width + 'px',
						padding:'5px 2px',
						'border-radius':'4px',
						'background-color':'#fff',
						border:'1px solid #ccc',
						'text-align':'center',
						float:'left'
					})
					.text(string.charAt(i).toUpperCase()));
		}
		
		this.listenTo(this.model, 'remove', this.remove);
		
		this.render();
	},
	
	render:function() {
		$(this.el).css({
			top:this.model.get('y') + 'px',
			left:this.model.get('x') + 'px'
		});
		var highlight = this.model.get('highlight');
		$(this.el).find('div').each(function(index,element) {
			if(index < highlight) {
				$(element).css({'font-weight':'bolder','background-color':'#aaa',color:'#fff'});
			} else {
				$(element).css({'font-weight':'normal','background-color':'#fff',color:'#000'});
			}
		});
	}
});
var ScoreModel = Backbone.Model.extend({
	defaults: {
		value: 0
	},

	addition: function() {
		this.set({value:this.get('value') + 100});
	},

	deduction: function(deduct) {
		if(this.get('value') > 0) {
			this.set({value:this.get('value') - deduct});
		}
	}
});

var ScoreBoardView = Backbone.View.extend({
	el:  "#scoreboard",

	initialize: function() {
		this.render();
	},

	render: function() {
		if(started) {
			this.$el.html('Score : ' + this.model.get('value'));
		} else {
			this.$el.html('Final Score : ' + this.model.get('value'));
		}
	}
});

var TyperView = Backbone.View.extend({
	
	
	initialize: function() {
		
		var wrapper = $('<div>')
			.css({
				position:'fixed',
				top:'0',
				left:'0',
				width:'100%',
				height:'100%'
			});
		this.wrapper = wrapper;
		
		var self = this;
		var text_input = $('<input>')
			.addClass('form-control')
			.css({
				'border-radius':'4px',
				position:'absolute',
				bottom:'50px',
				'min-width':'80%',
				width:'80%',
				'margin-bottom':'10px',
				'z-index':'1000'
			}).keyup(function() {
				var words = self.model.get('words');
				var typo = true;
				for(var i = 0;i < words.length;i++) {
					var word = words.at(i);
					var typed_string = $(this).val();
					var string = word.get('string');
					if(string.toLowerCase().indexOf(typed_string.toLowerCase()) == 0) {
						typo = false;
						word.set({highlight:typed_string.length});
						if(typed_string.length == string.length) {
							$(this).val('');
							score.model.addition();
							words.remove(word);
						}
					} else {
						word.set({highlight:0});
					}
				}
				
				if(typo) {
					score.model.deduction(20);
				}
			});
		var startButton = $('<input type="button" value="Start" />');
		startButton.css({
				'border-radius':'4px',
				position:'absolute',
				bottom:'10px',
				'min-width':'10%',
				width:'5%',
				'margin-bottom':'5px',
				'left':'10%'})
				.attr({
					class:'btn btn-block btn-large btn-success',
					id:'start'
				});;
		startButton.click(function() {
		   if(playing !== null){
				startButton.attr('value', 'Start');
		   }
		   typer.start();
		   
		});
		var pauseButton = $('<input type="button" value="Pause" />');
		pauseButton.css({
				'border-radius':'4px',
				position:'absolute',
				bottom:'10px',
				'min-width':'10%',
				width:'5%',
				'margin-bottom':'5px',
				'left':'25%'})
				.attr({
					class:'btn btn-block btn-large btn-warning',
					id:'pause'
				});;
		pauseButton.click(function() {
		  
		  typer.pause();
		  startButton.attr('value', 'Resume');
		});
		var stopButton = $('<button><i class="glyphicon glyphicon-stop"> Stop</i></button>');
		stopButton.css({
				'border-radius':'4px',
				position:'absolute',
				bottom:'10px',
				'min-width':'10%',
				width:'5%',
				'margin-bottom':'5px',
				'left':'40%'})
				.attr({
					class:'btn btn-block btn-large btn-danger',
					id:'start'
				});
		stopButton.click(function() {
		  startButton.attr('value', 'Start');
		  clearInterval(playing);
		  typer.stop();
		  stopped = 1;
		});
		
		var scoreBoard = $('<div>')
						.append($('<h2>')
							.attr({
								id: "scoreboard"
							}))
						.attr({
							class: "col-sm-3 pull-right"
						})
						.css({
							"z-index": "1000"
						})
		$(this.el)
			.append(wrapper
				.append($('<form>')
					.attr({
						role:'form'
					})
					.submit(function() {
						return false;
					})
					.append(text_input)
					.append(startButton)
					.append(pauseButton)
					.append(stopButton)
					.append(scoreBoard)
					));
		
		text_input.css({left:((wrapper.width() - text_input.width()) / 2) + 'px'});
		text_input.focus();
		
		this.listenTo(this.model, 'change', this.render);
	},
	
	render: function() {
		var model = this.model;
		var words = model.get('words');
		
		for(var i = 0;i < words.length;i++) {
			var word = words.at(i);
			if(!word.get('view')) {
				var word_view_wrapper = $('<div>');
				this.wrapper.append(word_view_wrapper);
				word.set({
					view:new WordView({
						model: word,
						el: word_view_wrapper
					})
				});
			} else {
				word.get('view').render();
			}
		}
	}
});

var Typer = Backbone.Model.extend({
	defaults:{
		max_num_words:10,
		min_distance_between_words:50,
		words:new Words(),
		min_speed:1,
		max_speed:10
	},
	
	initialize: function() {
		new TyperView({
			model: this,
			el: $(document.body)
		});
		score = new ScoreBoardView({
			model: new ScoreModel()
		});
		
		
	},

	start: function(start) {
		
		var animation_delay = 100;
		var self = this;
		if(!started){
		started = true;
		playing = setInterval(function() {
			self.iterate();
		},animation_delay);
		
		}
		
	},
	
	pause: function() {
		started = false;
		clearInterval(playing);
		playing = null;
		
	},
	stop: function() {
		started = false;
		_.invoke(words.toArray(), 'destroy');
		score.render();
		score.model.set({value:0})
		
		
		
		
	},
	resume: function() {
		
		console.log(play);
		var self = this;
		if(start){
			self.clearInterval(play);
			start = 0;
		};
		
	},
	
	iterate: function() {
		var words = null;
		words = this.get('words');
		if(words.length < this.get('max_num_words')) {
			var top_most_word = undefined;
			for(var i = 0;i < words.length;i++) {
				var word = words.at(i);
				if(!top_most_word) {
					top_most_word = word;
				} else if(word.get('y') < top_most_word.get('y')) {
					top_most_word = word;
				}
			}
			
			if(!top_most_word || top_most_word.get('y') > this.get('min_distance_between_words')) {
				var random_company_name_index = this.random_number_from_interval(0,company_names.length - 1);
				var string = company_names[random_company_name_index];
				var filtered_string = '';
				for(var j = 0;j < string.length;j++) {
					if(/^[a-zA-Z()]+$/.test(string.charAt(j))) {
						filtered_string += string.charAt(j);
					}
				}
				
				var word = new Word({
					x:this.random_number_from_interval(0,$(window).width()),
					y:0,
					string:filtered_string,
					speed:this.random_number_from_interval(this.get('min_speed'),this.get('max_speed'))
				});
				words.add(word);
				
			}
		}
		
		var words_to_be_removed = [];
		for(var i = 0;i < words.length;i++) {
			var word = words.at(i);
			
			word.move();
			
			if(word.get('y') > $(window).height() || word.get('move_next_iteration')) {
				words_to_be_removed.push(word);
			}
			
			if(word.get('highlight') && word.get('string').length == word.get('highlight')) {
				word.set({move_next_iteration:true});
			}
		}
		for(var i = 0;i < words_to_be_removed.length;i++) {
			words.remove(words_to_be_removed[i]);
		}
		
		score.render();
		this.trigger('change');
	},
	
	random_number_from_interval: function(min,max) {
	    return Math.floor(Math.random()*(max-min+1)+min);
	}
});
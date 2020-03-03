jQuery(document).ready(function($) {
  var IAC = {
    // Counts the number of initialisations run (we only want to run once)
    init_count: 1,

    // Counts the number of initialisations of the currently selected amount function run (we don't want to run on the first pass)
    current_init_count: 0,

	// The initial state of the frequency toggle
	initial_frequency: 'regularly',
	
    // The currently selected amounts
    current_onceoff_id: null,
    current_regularly_id: null,

    /**
     * Adds classes to the giving level containers based on conditions.
     *
     * @return {null}
     */
    addClassToGivingLevels: function() {
      var $this = $(this);

      // Add classes based on the giving level description
      var description = $this.find('span.BBFormRadioDescription').text();
      var type = 'unknown';
      if (description == 'regularly') {
        type = 'regularly';
      } else if(!$this.hasClass('iac-giving-level-item-other')) {
        type = 'onceoff';
      }
      $this.addClass('iac-giving-level-item-' + type);
    },

    /**
     * Adds click events to the frequency toggle.
     *
     * @param {Object} event The click event.
     *
     * @return {null}
     */
    frequencyToggleClickHandler: function(event) {
      event.preventDefault();

      var $link = $(this);
      var tab = $link.attr('href');

      // Set classes
      $('#iac-frequency-container .iac-frequency a.iac-frequency-active').removeClass('iac-frequency-active');
      $link.addClass('iac-frequency-active');

      // Trigger click of real checkbox and show/hide appropriate giving levels
      var $check_frequency = $('#bboxdonation_recurrence_chkMonthlyGift');
      var $giving_levels = $('#bboxdonation_gift_rdlstGivingLevels');
      switch (tab) {
        case '#once-off':
          if ($check_frequency.prop('checked')) {
            $check_frequency.trigger('click');
          }
          $giving_levels.find('.iac-giving-level-item-onceoff').show();
          $giving_levels.find('.iac-giving-level-item-regularly').hide();
          break;
        case '#regularly':
          if (!$check_frequency.prop('checked')) {
            $check_frequency.trigger('click');
          }
          $giving_levels.find('.iac-giving-level-item-onceoff').hide();
          $giving_levels.find('.iac-giving-level-item-regularly').show();
          break;
      }
    },

    /**
     * Builds the frequency toggle elements.
     *
     * @return {Object} $container The HTML element as a jQuery object.
     */
    buildFrequencyToggle: function() {
      var $container = $('<div></div>').attr('id', 'iac-frequency-container');
      var $freq_label = $('<p></p>').addClass('iac-frequency-label').text('I want to give');
      var $freq_outer = $('<div></div>').addClass('iac-frequency-container');
      var $freq_inner = $('<div></div>').addClass('iac-frequency');
      var $freq_onceoff = $('<a></a>').attr('href', '#once-off').text('once-off');
      var $freq_regularly = $('<a></a>').attr('href', '#regularly').addClass('iac-frequency-active').text('regularly');

      $container.append($freq_label);
      $container.append($freq_outer);
      $freq_outer.append($freq_inner);
      $freq_inner.append($freq_onceoff);
      $freq_inner.append($freq_regularly);

      return $container;
    },

    /**
     * Adds change events to the native frequency checkbox element.
     *
     * @return {null}
     */
    frequencyCheckboxChangeHandler: function() {
      IAC.selectDefaultAmount();
      IAC.updateDonateButton();
    },

    /**
     * Adds change events to the native frequency select element.
     *
     * @return {null}
     */
    frequencySelectChangeHandler: function() {
      IAC.updateDonateButton();
    },

    /**
     * Remembers the selected once-off and regular payment amounts so that
     * changing between payment frequencies doesn't cause chaos.
     *
     * @return {null}
     */
    selectDefaultAmount: function() {
      // Don't run this the first time as it's not necessary
      if (IAC.current_init_count == 0) {
        IAC.current_init_count = 1;
        return;
      }

      // If "other" amount is selected then there is nothing to do
      var other_selected = $('#bboxdonation_gift_rdlstGivingLevels .iac-giving-level-item-other').find('label').hasClass('BBFormRadioLabelGivingLevelSelected');
      if (other_selected) {
        return;
      }

      // Get the ID of the currently selected "once-off" giving level
      var $onceoff_selected = $('#bboxdonation_gift_rdlstGivingLevels .iac-giving-level-item-onceoff').find('label.BBFormRadioLabelGivingLevelSelected');
      if ($onceoff_selected.length) {
        IAC.current_onceoff_id = $onceoff_selected.parent().find('input[type="radio"]').attr('id');
      }

      // Get the ID of the currently selected "regularly" giving level
      var $regularly_selected = $('#bboxdonation_gift_rdlstGivingLevels .iac-giving-level-item-regularly').find('label.BBFormRadioLabelGivingLevelSelected');
      if ($regularly_selected.length) {
        IAC.current_regularly_id = $regularly_selected.parent().find('input[type="radio"]').attr('id');
      }

      // Get the current frequency and set the current ID accordingly
      var $check_frequency = $('#bboxdonation_recurrence_chkMonthlyGift');
      var frequency = 'onceoff';
      var current_id = IAC.current_onceoff_id;
      if ($check_frequency.prop('checked')) {
        frequency = 'regularly';
        current_id = IAC.current_regularly_id;
      }

      // Trigger a click on the appropriate giving level to make it selected in the UI
      var $giving_level_items = $('#bboxdonation_gift_rdlstGivingLevels .iac-giving-level-item-' + frequency);
      if (current_id) {
        $giving_level_items.find('input#' + current_id).parent().find('label').trigger('click');
      } else {
        $giving_level_items.first().find('label').trigger('click');
      }

      // If we aren't on the "amount" tab, then go there so the user is aware that the amount has probably changed too
      $('.iac-tab:not(.iac-tab-active) a[href="#amount"]').trigger('click');
    },

    /**
     * Updates the donate button and the frequency toggle when the amount or
     * frequency is changed.
     *
     * @return {null}
     */
    updateDonateButton: function() {
      // Get the current amount
      var amount = $('.iac-container input[name="bboxdonation$gift$GivingLevel"]:checked').val();
      if (! $.isNumeric(amount)) {
        amount = $('.iac-container #bboxdonation_gift_txtAmountOther').val();
      } else {
        amount = '$' + amount;
      }

      if (! amount) {
        return;
      }

      // Remove any trailing zero cents.
      amount = amount.replace(/\.00$/, '');

      // Get the current frequency
      var $check_frequency = $('.iac-container #bboxdonation_recurrence_chkMonthlyGift');
      var frequency = $('.iac-container #bboxdonation_recurrence_ddFrequency option:selected').text();

      // Set the button frequency
      var button_frequency = '';
      if ($check_frequency.prop('checked')) {
        button_frequency = ' ' + frequency;
      }

      // Update the frequency toggle
      var $link_toggle = $('.iac-container .iac-frequency a[href="#regularly"]');
      $link_toggle.text(frequency);

      // Update the submit button
      var $button_submit = $('.iac-container #bboxdonation_btnSubmit');
      $button_submit.attr('value', 'Donate ' + amount + button_frequency);
    },

    /**
     * Initialises the form.
     *
     * Grabs what it needs from the Online Express form and generates any new
     * elements and actions that are required.
     *
     * @param {number} force_init_count Forces initialisation count.
     *
     * @return {null}
     */
    init: function(force_init_count) {
	  var $container = $('.iac-container');
      if (!$container.length) {
        return;
      }
      var initial_frequency = $container.attr('data-frequency');
	  if (['regularly', 'once-off'].indexOf(initial_frequency) !== -1) {
		IAC.initial_frequency = initial_frequency;
	  }

      // Force initialisation to run again - happens when form submission returns an error
      var force_frequency_to_regularly = (IAC.initial_frequency === 'regularly');
      if ($.isNumeric(force_init_count)) {
        IAC.init_count = force_init_count;
        force_frequency_to_regularly = false;
      }

      // Don't run when first called
      if (IAC.init_count == 0) {
        // Increment the init counter
        IAC.init_count = 1;
        return;
      }

      // Don't run again
      if (IAC.init_count == 2) {
        return;
      }

      // Get the giving level items
      var $giving_level_items = $('.iac-container #bboxdonation_gift_rdlstGivingLevels .BBFormRadioGivingLevelItem');

      // Give the "other" amount item an easy to use class
      var $giving_level_item_other = $giving_level_items.last().addClass('iac-giving-level-item-other');

      // Add easy to use class names to all the items
      $giving_level_items.each(IAC.addClassToGivingLevels);

      // Build and inject the frequency toggle beneath the error display
      var $frequency_toggle = IAC.buildFrequencyToggle();
      $frequency_toggle.prependTo($('.iac-container .BBFormSection.BBFormSectionRecurrenceInfo'));

      // Show the action container
      $('.iac-action').show();

      // Show the frequency label
      $('.iac-container #iac-frequency-container .iac-frequency-label').show();

      // Show the frequency container - use css() method here because show() will make it display:block
      $('.iac-container #iac-frequency-container .iac-frequency-container').css('display', 'flex');
      
      // Show the frequency block
      $('.iac-container #iac-frequency-container').show();

      // Watch for change on the native frequency controls
      $('.iac-container #bboxdonation_recurrence_chkMonthlyGift').change(IAC.frequencyCheckboxChangeHandler);
      $('.iac-container #bboxdonation_recurrence_ddFrequency').change(IAC.frequencySelectChangeHandler);

      // Setup the frequency toggle
      $('.iac-container #iac-frequency-container .iac-frequency a').click(IAC.frequencyToggleClickHandler);

      // Click the appropriate frequency toggle link (we default to regular payments)
      var $check_frequency = $('.iac-container #bboxdonation_recurrence_chkMonthlyGift');
      if (force_frequency_to_regularly || $check_frequency.prop('checked')) {
        $('.iac-container #iac-frequency-container .iac-frequency a[href="#regularly"]').trigger('click');
      } else {
        $('.iac-container #iac-frequency-container .iac-frequency a[href="#once-off"]').trigger('click');
      }

      // Increment the init counter
      IAC.init_count = 2;
    }
  };

  // Use an undocumented Online Express hook which looks for this name.
  window.bboxShowFormComplete = IAC.init;

  // Override the form submission action - this uses an undocumented Online Express hook function
  if ($('.iac-container').length) {
    window.bboxOverrides = {
      handleSubmitCallbackOverride: function(a) {
        // Log using bbox logger for debugging
        bbox.log('bboxOverrides.handleSubmitCallbackOverride()');

        // Use bbox jQuery instance here to stay compatible
        bb$('#bbox-root').unblock();

        // "Squirt" markup
        bbox.squirtMarkup(a, true);

        // Run our init function to reset payment amount functionality
        window.bboxShowFormComplete(1);

        // Trigger click of our "payment" tab to return to payment tab
        jQuery('.iac-container .iac-tab a[href="#payment"]').trigger('click');
      }
    };
  }

  // Setup the navigation tabs and continue buttons
  $('.iac-container .iac-tab a, .iac-action a').click(function(event) {
    event.preventDefault();

    // Remove active class from tabs
    $('.iac-container .iac-tab').removeClass('iac-tab-active');

    var $link = $(this);
    var tab = $link.attr('href');

    // Add active class to correct tab
    $(".iac-container .iac-tab a[href='" + tab + "']").parent().addClass('iac-tab-active');

    // Show/hide appropriate part of form and update the continue link
    var $form_amount = $('.iac-container .BBFormSection.BBDFormSectionGiftInfo').hide();
    var $form_details = $('.iac-container .BBFormSection.BBDFormSectionBillingInfo').hide();
    var $form_contact = $('.iac-container .BBFormSection.BBFormSectionGiftAttributes').hide();
    var $form_payment = $('.iac-container .BBFormSection.BBDFormSectionPaymentInfo').hide();
    var $continue = $('.iac-container .iac-action a');
    var $form_submit = $('.iac-container .BBFormSection.BBFormButtonRow');
    switch (tab) {
      case '#amount':
        $form_amount.show();
        $continue.show().attr('href', '#details');
        $form_submit.hide();
        break;
      case '#details':
        $form_details.show();
        $form_contact.show();
        $continue.show().attr('href', '#payment');
        $form_submit.hide();
        break;
      case '#payment':
        $form_payment.show();
        $continue.hide();
        IAC.updateDonateButton();
        $form_submit.show();
        break;
    }

    // Scroll to the top of the form in case the form is long
    var offset = $('.iac-container').offset().top - $('#wpadminbar').outerHeight();
    $('html, body').animate({scrollTop: offset}, 500);
  });
});

var dataset = new recline.Model.Dataset({
  url: '0As2ywI3daTRTdGdJWTUwYzNGYUxkM0ZxSFRQeUpiV1E',
  worksheetIndex: 1,
  backend: 'gdocs'
});

var filters = [{
  id: 'categories',
  label: 'Categories',
  column: 'category',
  values: ['individual', 'startup', 'small company', 'big company']
}, {
  id: 'technicalarea',
  label: 'Technical Area',
  column: 'technicalarea',
  values: ['Data Acquisition', 'Data Analysis', 'Data Curation', 'Data Storage', 'Data Usage']
}, {
  id: 'industrialsector',
  label: 'Industrial Sector',
  column: 'industrialsector',
  values: ['Finance & Insurance Sectors', 'Health Sector', 'Manufacturing, Retail, Energy & Transport Sectors', 'Public Sector', 'Telco, Media & Entertainment Sectors']
}, {
  id: 'country',
  label: 'Country',
  column: 'country'
}];

dataset.fetch().done(function(allDataset) {
  _.each(filters, function(filter) {
    if (filter.values === undefined) {
      filter.values = _.uniq(allDataset.records.pluck('country'));
    }
  });
  _.each(filters, function(filter) {
    _.each(filter.values, function(value) {
      $('#' + filter.id).append('<option value="' + value + '">' + value + '</option>');
    })
  });

  var thedataset = new recline.Model.Dataset({
    records: allDataset.records.map(function(x) {
      return x.toJSON();
    })
  });

  var applyFilter = function() {
    thedataset.records.reset(allDataset.records.map(function(x) {
      return x.toJSON();
    }));
    var filteredRecords = thedataset.records.models;
    _.each(filters, function(filter) {
      var val = $('#' + filter.id).val();
      if (val === '') {
        return;
      }
      filteredRecords = filteredRecords.filter(function(record) {
        return record.get(filter.column).indexOf(val) !== -1;
      });
    });
    thedataset.records.reset(_.map(filteredRecords, function(x) {
      return x.toJSON();
    }));
  };

  _.each(filters, function(filter) {
    $('#' + filter.id).on('change', applyFilter);
  })

  var $el = $('#explorer');

  var mapState = {
    'autoZoom': true
  };

  var hiddenFields = ['timestamp', 'linkedin', 'twitter', 'notes', 'contribution', 'legitimacy', 'willingness', 'influence', 'necessity', 'countrycode', 'lat', 'lon', 'industrialsector', 'technicalarea', 'category'];

  var gridState = {
    'hiddenFields': hiddenFields
  };

  var map = new recline.View.Map({
    model: thedataset,
    state: mapState
  });

  var grid = new recline.View.Grid({
    model: thedataset
  });

  map.infobox = function(record) {
    var html = '<h3><a target="_blank" href="' + record.get('url') + '">' + record.get('companyname') + '</a></h3>'
    html += '<p>' + record.get('city') + ', ' + record.get('countrycode') + '<br/>';
    html += 'Technical Area: ' + record.get('technicalarea') + '<br/>';
    html += 'Industry Sector: ' + record.get('industrysector') + '</p>';
    return html;
  }

  var views = [{
    id: 'map',
    label: 'Map',
    view: map
  }, {
    id: 'grid', // used for routing
    label: 'Table', // used for view switcher
    view: grid
  }];

  var state = {
    'view-map': mapState,
    'view-grid': gridState,
    readOnly: true
  };

  var myExplorer = new recline.View.MultiView({
    model: thedataset,
    el: $el,
    views: views,
    sidebarViews: [],
    state: state
  });

  //Get rid of the sidebar
  map.elSidebar.css('width', '0px');
  map.elSidebar.remove();

  //I can't see a way to do these through recline
  $('.header').children().hide();
  $('.navigation').show();

  //Load previously invisible tiles
  map.map.invalidateSize();

  //Remove some fields from table. For some reason this only works post-hoc with a re-render
  grid.state.attributes.hiddenFields = hiddenFields;
  //Rename field labels. Changing them at the dataset level doesn't seem to work. Sigh.
  _.each(grid.fields.models, function(field) {
    switch (field.attributes.id) {
      case 'companyname':
        field.attributes.label = 'Company Name';
        break;
      case 'country':
        field.attributes.label = 'Country';
        break;
      case 'city':
        field.attributes.label = 'City';
        break;
      case 'url':
        field.attributes.label = 'URL';
        break;
    }
  });
  grid.render();
});
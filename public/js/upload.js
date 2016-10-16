$(document).ready(function() {
  $("#wiki_upload").ajaxForm(function(response) {
    $('#upload_status').html(response);
  });
  $("input#wiki_file").change(function() {
    var filename = $(this).val().replace(/^.*[\\\/]/, '')
    $("input#rep_file_name").val(filename);
  });
});

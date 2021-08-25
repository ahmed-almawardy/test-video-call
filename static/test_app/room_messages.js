'use strict'


function make_request(url) {
    $.ajax({
        url: url,
        method: 'GET',
        success: (data, status_text, jqxml)=>{
            console.log(data)
        
        },error: (error, status_text, jq)=>{
            console.log(error)
            console.log(status_text)
        }
    })
}
function get_messages() {

}


$(window).load(()=>{
    get_messages90  
})
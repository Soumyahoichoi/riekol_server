const Layout = require('./layout');

<Layout>
    <h4>Dear {ticketDetails[0].customer_name.toUpperCase()}</h4>
    <h4>Your Ticket Details : </h4>
    <hr />
    <br />
    <ul class="users">
        {ticketDetails.map((ticket) => (
            <li key={ticket}>
                {/* <strong> */}
                {ticket.name} - {ticket.registration_fee} x {ticket.count}
                {/* </strong> */}
            </li>
        ))}
    </ul>
    <h4>
        Your total :<span>{ticketDetails.reduce((acc, item) => acc + +item.registration_fee.split(',').join('') * +item.count, 0)}</span>
    </h4>
</Layout>;

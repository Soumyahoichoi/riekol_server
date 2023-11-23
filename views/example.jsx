const Layout = require('./layout');

<Layout>
    <h2>Dear {ticketDetails[0].customer_name.toUpperCase()}</h2>
    <h3>Your Ticket Details : </h3>
    <hr />
    <br />
    <ul class="users">
        {ticketDetails.map((ticket) => (
            <li key={ticket}>
                <strong style={{ color: 'red' }}>
                    {ticket.name} - {ticket.registration_fee}
                </strong>
            </li>
        ))}
    </ul>
    <h2>
        Your total :<span>{ticketDetails.reduce((acc, item) => acc + +item.registration_fee.split(',').join(''), 0)}</span>
    </h2>
</Layout>;

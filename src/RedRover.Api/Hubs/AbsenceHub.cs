using Microsoft.AspNetCore.SignalR;

namespace RedRover.Api.Hubs;

public class AbsenceHub : Hub
{
    public async Task JoinDistrictGroup(string districtName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, districtName);
    }

    public async Task LeaveDistrictGroup(string districtName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, districtName);
    }
}

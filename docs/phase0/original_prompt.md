analyse amq_partners platform's (/home/carim/Github/amq_partners)  recontact
  reservation & reservations system and the relation between them,apis,models and UI
  involved
  
  we're going to copy the way amq_partners does the recontact module and implement it
  here with a few key difference:
  -in this platform ,there's no recontact,we're going to start with a phone number and
  make first contact
  -so we dont have a prospect' prior reservation and info ,all we have is a phone and maybe a
  name
  -when a user connects to this new platform,if he's only a telephoniste,he's
  going to be redirected to special telephoniste view ,if he's a telephoniste and something else ,or he's not a telephoniste,when connecting he choose which
  view he want's to navigate to ,one is a dashboard, the other the telephoniste
  view,and he should be able to easily navigate between them through the app bar
  -to start out ,we only have three actors on the system:
  	*admin: have access to admin dashboard with its own roles and permissions 
  	*agent: have access to agent dashboard with its own roles and permissions
  	*telephoniste: straighforward ,have access to telephoniste view we may later have roles and permission for this actor but for now let's keep it simple
	we can later have more actors so it should be easy to later add more actors to the system
	each actor should have his own completely seperate view with a way to toggle between views if user is a multiple actor 
  -the telephoniste view should be really similar to that of the amq_partners platform,but should be adapted to the new workflow and the data we have
  
  here's the database structure for the new platform:
  
	*users collection:
		name
		email
		password
		isTelephoniste
		isAdmin
		adminRoles:[roleId]
		adminDirectPermissions:[list of permissions from admin permissions ts file]
		isAgent
		agentRoles:[roleId]
		agentDirectPermissions:[list of permissions from agent permissions ts file]
		directPermissions:[list of permissions from permissions.ts file]
	*agent profiles:a collection to keep track of users who are assigned to reservations
		userId
		availablity:list of datetime ranges
	*roles collection:
		actor: admin or agent
		name
		code
		permissions:[list of permissions from permissions.ts file]
	*permission ts files:
		list of permissions with name,code and description; available both to the routes
		and the UI
	*contacts:this is the main collection for keeping track of potential customers
		phone:unique ,normalized to 10 digits 
		name?
		email?
		address?
		postalCode? should be a valid canadian postal (eg "A1A 1A1")
		status:contactStatusId
		statusHistory:history of status changes and who did the change and when
		assignedToTelephonisteId?:ref userId (telephoniste this contact is assigned to)
		assignmentHistory: contact can be assigned,unassigned and moved from a userId to another and we gotta keep track of that 
		callHistory: history of twilio calls and who did the call and when
		reservationId?:defaults to null but get a ref to reservations if the contact books a reservation
		isConverted:defaults to false; whether the contact has booked a reservation
		convertedBy?:who did the conversion 
	*contact statuses:
		name:display name
		code
		color: hex color to control how it shows up in lists
	*reservation:
		date:the date the reservation is going to take place,this will be set when telephoniste converts a contact ,this date time can only be set to a datetime where an agent is available and doesnt have an existing reservation he's assigned to (and there should be some time between reservations because the agent have to move around)
		assignedToAgentId: ref userId (agent this contact is assigned to)
	we need the UI and some of the logic behind the  /recontact-reservations and /recontact-reservations/telephoniste-management for the admin and /telephoniste-recontacts for the telephoniste
	leave the agent's view empty for now (just a welcome message) ;but adapt for new requirements and data
	
	
	start with write a comprehensive plan in an md file and then execute tasks 


		
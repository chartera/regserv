/**
 * Created by naeltasmim on 17.02.17.
 */


module.exports = function () {

    const createMember = function () {
        return {
            docs: [
                {
                    _id: "_design/newDocs",
                    language: "javascript",
                    validate_doc_update: function(newDoc, oldDoc, userCtx, secObj){
                        var allow_types = ["info", "member", "event"];
                        if(!newDoc.type) {
                            throw({forbidden: 'doc.type must be specified!'});
                        }

                        if(allow_types.indexOf(newDoc.type) === -1){
                            throw({forbidden: 'Wrong type definition!'});
                        }

                        if(newDoc.type === 'info' && userCtx.roles.indexOf(userCtx.db + '_admin') === -1) {
                            throw({unauthorized: 'You must be admin!'});
                        }


                    }

                },
                {
                    _id: "_design/members",
                    views: {
                        members: {
                            map : function(doc){
                                if(doc.type === 'member')
                                    emit(doc.name, doc._rev)
                            }
                        },
                        getEventsBy_Y: {
                            map : function (doc) {
                                if(doc.type === 'event')
                                    emit([doc.start_year], doc)
                            }
                        }
                    }
                }
            ]
        }
    };

    const getPolice = function (database) {
        return {
            "admins":
                {
                    "names": [],
                    "roles": [`${database}_admin`]
                },
            "members":
                {
                    "names": [],
                    "roles": [`${database}_member`]
                }
        }
    };

    const getInitialRoles = function (user, database) {
        const _role = `${database}_admin`;
        user.roles.push(_role);
        return user;
    };

    return {
        createMember: createMember,
        getPolice: getPolice,
        getInitialRoles: getInitialRoles
    }

};
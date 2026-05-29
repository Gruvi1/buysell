package ru.prod.buysell.controller;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class Path {
    public static final String AUTH =  "/api/v1/auth";
    public static final String LOGIN = "/login";
    public static final String REGISTER = "/register";

    public static final String PRODUCT = "/api/v1/product";
    public static final String PRODUCT_DETAILS = "/{id}";

    public static final String IMAGE = "/api/v1/image";
    public static final String IMAGE_DETAILS = "/{id}";

    public static final String CHAT = "/api/v1/chat";
    public static final String DIALOGS = "/dialogs";
    public static final String MESSAGES = "/dialogs/{dialogId}/messages";

}
